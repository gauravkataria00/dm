const express = require("express");
const bcrypt = require("bcryptjs");
const PlatformAdmin = require("../models/PlatformAdmin");
const Tenant = require("../models/Tenant");
const TenantAdmin = require("../models/TenantAdmin");
const {
  createSalt,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
} = require("../utils/authUtils");

const router = express.Router();

const platformTokenSecret =
  process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET || "change-this-platform-secret";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.replace("Bearer ", "").trim();
};

const requirePlatformAdmin = (req, res, next) => {
  try {
    const token = getBearerToken(req);
    const claims = verifyToken(token, platformTokenSecret);
    if (claims.role !== "platform_admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.platformAdmin = claims;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

router.post("/bootstrap", async (req, res) => {
  try {
    const { bootstrapKey, name, email, password } = req.body;
    const normalizedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);
    const passwordValue = String(password || "");
    const requiredKey = process.env.PLATFORM_BOOTSTRAP_KEY || "setup-platform-admin";

    console.log("[platform/bootstrap] request", {
      email: normalizedEmail,
      nameLength: normalizedName.length,
      passwordLength: passwordValue.length,
    });

    if (bootstrapKey !== requiredKey) {
      return res.status(403).json({ error: "Invalid bootstrap key" });
    }

    if (!normalizedName || !normalizedEmail || !passwordValue) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existing = await PlatformAdmin.findOne({}).lean();
    console.log("[platform/bootstrap] existingAdmin", { exists: Boolean(existing) });
    if (existing) {
      return res.status(409).json({ error: "Platform admin already exists. Use POST /api/platform/admin-reset to reset credentials." });
    }

    const passwordSalt = createSalt();
    const passwordHash = hashPassword(passwordValue, passwordSalt);

    console.log("[platform/bootstrap] generatedCredentials", {
      saltLength: passwordSalt.length,
      hashLength: passwordHash.length,
    });

    const admin = await PlatformAdmin.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordSalt,
      passwordHash,
      isActive: true,
    });

    console.log("[platform/bootstrap] adminCreated", {
      id: String(admin._id),
      email: admin.email,
      isActive: admin.isActive,
    });

    return res.json({
      success: true,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Platform bootstrap error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/admin-reset", async (req, res) => {
  try {
    const { bootstrapKey, email, password, name } = req.body;
    const requiredKey = process.env.PLATFORM_BOOTSTRAP_KEY || "setup-platform-admin";
    const normalizedEmail = normalizeEmail(email);
    const passwordValue = String(password || "");
    const normalizedName = String(name || "Platform Admin").trim();

    console.log("[platform/admin-reset] request", {
      email: normalizedEmail,
      passwordLength: passwordValue.length,
      nameLength: normalizedName.length,
    });

    if (bootstrapKey !== requiredKey) {
      return res.status(403).json({ error: "Invalid bootstrap key" });
    }

    if (!normalizedEmail || !passwordValue) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const existing = await PlatformAdmin.findOne({});
    if (!existing) {
      return res.status(404).json({ error: "No platform admin found. Use /bootstrap to create one." });
    }

    const passwordSalt = createSalt();
    const passwordHash = hashPassword(passwordValue, passwordSalt);

    existing.email = normalizedEmail;
    existing.name = normalizedName;
    existing.passwordSalt = passwordSalt;
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    await existing.save();

    console.log("[platform/admin-reset] success", {
      id: String(existing._id),
      email: existing.email,
      name: existing.name,
    });

    return res.json({
      success: true,
      admin: { id: existing._id, name: existing.name, email: existing.email },
    });
  } catch (error) {
    console.error("Platform admin-reset error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const passwordValue = String(password || "");

    console.log("[platform/login] request", {
      email: normalizedEmail,
      passwordLength: passwordValue.length,
    });

    if (!normalizedEmail || !passwordValue) {
      return res.status(400).json({ error: "email and password are required" });
    }

    let admin = await PlatformAdmin.findOne({ email: normalizedEmail });
    let repairEmailAfterPasswordCheck = false;

    if (!admin) {
      const candidates = await PlatformAdmin.find({}).limit(50);
      admin = candidates.find((candidate) => normalizeEmail(candidate.email) === normalizedEmail) || null;

      console.log("[platform/login] normalizedFallback", {
        candidateCount: candidates.length,
        matched: Boolean(admin),
        matchedId: admin ? String(admin._id) : null,
      });

      if (!admin && candidates.length === 0) {
        console.log("[platform/login] rootCause", "No PlatformAdmin documents found in current MongoDB database");
      }

      if (!admin && candidates.length === 1) {
        admin = candidates[0];
        repairEmailAfterPasswordCheck = normalizeEmail(admin.email) !== normalizedEmail;
        console.log("[platform/login] singleAdminRecovery", {
          adminId: String(admin._id),
          storedEmail: admin.email,
          requestedEmail: normalizedEmail,
          willRepairOnSuccess: repairEmailAfterPasswordCheck,
        });
      }

      if (!admin && candidates.length > 1) {
        console.log("[platform/login] rootCause", "Multiple PlatformAdmin documents exist and submitted email does not match any normalized stored email");
      }
    }

    console.log("[platform/login] adminLookup", {
      found: Boolean(admin),
      isActive: admin?.isActive || false,
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = verifyPassword(passwordValue, admin.passwordSalt, admin.passwordHash);
    console.log("[platform/login] passwordVerification", {
      valid,
      saltLength: String(admin.passwordSalt || "").length,
      hashLength: String(admin.passwordHash || "").length,
      adminId: String(admin._id),
    });

    if (valid && repairEmailAfterPasswordCheck) {
      const previousEmail = admin.email;
      admin.email = normalizedEmail;
      await admin.save();
      console.log("[platform/login] emailRepaired", {
        adminId: String(admin._id),
        previousEmail,
        updatedEmail: admin.email,
      });
    }

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(
      {
        role: "platform_admin",
        adminId: String(admin._id),
        email: admin.email,
      },
      platformTokenSecret,
      24
    );

    return res.json({
      success: true,
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Platform login error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.get("/tenants", requirePlatformAdmin, async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();

    const tenantIds = tenants.map((tenant) => tenant._id);
    const tenantAdmins = await TenantAdmin.find({ tenantId: { $in: tenantIds } })
      .select("tenantId name email displayPassword isActive createdAt")
      .lean();

    const adminMap = tenantAdmins.reduce((acc, admin) => {
      const key = String(admin.tenantId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(admin);
      return acc;
    }, {});

    const data = tenants.map((tenant) => ({
      id: tenant._id,
      name: tenant.name,
      code: tenant.code,
      monthlyCharge: tenant.monthlyCharge,
      nextDueDate: tenant.nextDueDate,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      admins: (adminMap[String(tenant._id)] || []).map((admin) => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        tempPassword: admin.displayPassword || "",
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      })),
    }));

    return res.json(data);
  } catch (error) {
    console.error("Platform tenants list error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/tenants", requirePlatformAdmin, async (req, res) => {
  try {
    const {
      tenantName,
      tenantCode,
      monthlyCharge,
      nextDueDate,
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;

    if (!tenantName || !tenantCode || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        error: "tenantName, tenantCode, adminName, adminEmail and adminPassword are required",
      });
    }

    const normalizedCode = String(tenantCode).trim().toLowerCase();
    const normalizedAdminName = String(adminName).trim();
    const normalizedEmail = normalizeEmail(adminEmail);
    const adminPasswordValue = String(adminPassword || "").trim();

    if (!normalizedAdminName || !normalizedEmail || !adminPasswordValue) {
      return res.status(400).json({
        error: "tenantName, tenantCode, adminName, adminEmail and adminPassword are required",
      });
    }

    const [tenantExists, adminExists] = await Promise.all([
      Tenant.findOne({ code: normalizedCode }).lean(),
      TenantAdmin.findOne({ email: normalizedEmail }).lean(),
    ]);

    if (tenantExists) {
      return res.status(409).json({ error: "Tenant code already exists" });
    }

    if (adminExists) {
      return res.status(409).json({ error: "Admin email already exists" });
    }

    const tenant = await Tenant.create({
      name: tenantName,
      code: normalizedCode,
      monthlyCharge: Number(monthlyCharge || 0),
      nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
      isActive: true,
    });

    const passwordHash = await bcrypt.hash(adminPasswordValue, 10);

    console.log("[tenant-admin/create] credentials", {
      email: normalizedEmail,
      hashPrefix: String(passwordHash).slice(0, 7),
      hashLength: String(passwordHash).length,
    });

    const tenantAdmin = await TenantAdmin.create({
      tenantId: tenant._id,
      name: normalizedAdminName,
      email: normalizedEmail,
      displayPassword: adminPasswordValue,
      passwordSalt: "",
      passwordHash,
      mustChangePassword: true,
      isActive: true,
    });

    return res.json({
      success: true,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        code: tenant.code,
      },
      admin: {
        id: tenantAdmin._id,
        name: tenantAdmin.name,
        email: tenantAdmin.email,
        tempPassword: adminPasswordValue,
      },
    });
  } catch (error) {
    console.error("Platform create tenant error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.put("/tenants/:tenantId", requirePlatformAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const {
      tenantName,
      monthlyCharge,
      isActive,
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (typeof tenantName !== "undefined") {
      tenant.name = String(tenantName || "").trim() || tenant.name;
    }

    if (typeof monthlyCharge !== "undefined") {
      tenant.monthlyCharge = Number(monthlyCharge || 0);
    }

    if (typeof isActive !== "undefined") {
      tenant.isActive = Boolean(isActive);
    }

    await tenant.save();

    const tenantAdmin = await TenantAdmin.findOne({ tenantId }).sort({ createdAt: 1 });
    if (!tenantAdmin) {
      return res.status(404).json({ error: "Tenant admin not found" });
    }

    if (typeof adminName !== "undefined") {
      tenantAdmin.name = String(adminName || "").trim() || tenantAdmin.name;
    }

    if (typeof adminEmail !== "undefined") {
      const normalizedAdminEmail = normalizeEmail(adminEmail);
      if (!normalizedAdminEmail) {
        return res.status(400).json({ error: "Admin email is required" });
      }

      const existingByEmail = await TenantAdmin.findOne({
        email: normalizedAdminEmail,
        _id: { $ne: tenantAdmin._id },
      }).lean();

      if (existingByEmail) {
        return res.status(409).json({ error: "Admin email already exists" });
      }

      tenantAdmin.email = normalizedAdminEmail;
    }

    if (typeof adminPassword !== "undefined" && String(adminPassword).trim()) {
      const adminPasswordValue = String(adminPassword).trim();
      tenantAdmin.passwordHash = await bcrypt.hash(adminPasswordValue, 10);
      tenantAdmin.passwordSalt = "";
      tenantAdmin.displayPassword = adminPasswordValue;
    }

    await tenantAdmin.save();

    return res.json({
      success: true,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        code: tenant.code,
        monthlyCharge: tenant.monthlyCharge,
        isActive: tenant.isActive,
      },
      admin: {
        id: tenantAdmin._id,
        name: tenantAdmin.name,
        email: tenantAdmin.email,
        tempPassword: tenantAdmin.displayPassword || "",
      },
    });
  } catch (error) {
    console.error("Platform update tenant error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.delete("/tenants/:tenantId", requirePlatformAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    await Promise.all([
      Tenant.deleteOne({ _id: tenantId }),
      TenantAdmin.deleteMany({ tenantId }),
    ]);

    return res.json({ success: true });
  } catch (error) {
    console.error("Platform delete tenant error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/tenant-admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const passwordRaw = String(password || "");
    const passwordValue = passwordRaw.trim();

    if (!normalizedEmail || !passwordValue) {
      return res.status(400).json({ error: "email and password are required" });
    }

    let admin = await TenantAdmin.findOne({ email: normalizedEmail }).populate("tenantId");

    if (!admin) {
      const candidates = await TenantAdmin.find({}).populate("tenantId").limit(200);
      const normalizedMatch = candidates.find(
        (candidate) => normalizeEmail(candidate.email) === normalizedEmail
      );

      if (normalizedMatch) {
        admin = normalizedMatch;
        if (admin.email !== normalizedEmail) {
          const previousEmail = admin.email;
          admin.email = normalizedEmail;
          await admin.save();
          console.log("[tenant-admin/login] emailRepaired", {
            adminId: String(admin._id),
            previousEmail,
            updatedEmail: admin.email,
          });
        }
      }
    }

    console.log("[tenant-admin/login] adminLookup", {
      email: normalizedEmail,
      found: Boolean(admin),
      isActive: admin?.isActive || false,
      tenantActive: admin?.tenantId?.isActive || false,
    });

    if (!admin || !admin.isActive || !admin.tenantId || !admin.tenantId.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let valid = false;
    const storedHash = String(admin.passwordHash || "");
    const passwordCandidates =
      passwordRaw !== passwordValue ? [passwordRaw, passwordValue] : [passwordValue];

    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
      for (const candidate of passwordCandidates) {
        if (await bcrypt.compare(candidate, storedHash)) {
          valid = true;
          break;
        }
      }
    } else {
      for (const candidate of passwordCandidates) {
        if (verifyPassword(candidate, admin.passwordSalt, storedHash)) {
          valid = true;
          break;
        }
      }

      if (valid) {
        admin.passwordHash = await bcrypt.hash(passwordValue, 10);
        admin.passwordSalt = "";
        await admin.save();
      }
    }

    console.log("[tenant-admin/login] passwordCompare", {
      adminId: String(admin._id),
      valid,
      hashPrefix: storedHash.slice(0, 7),
      triedVariants: passwordCandidates.length,
    });

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(
      {
        role: "tenant_admin",
        tenantId: String(admin.tenantId._id),
        tenantCode: admin.tenantId.code,
        adminId: String(admin._id),
      },
      platformTokenSecret,
      24
    );

    return res.json({
      success: true,
      token,
      mustChangePassword: admin.mustChangePassword,
      tenant: {
        id: admin.tenantId._id,
        name: admin.tenantId.name,
        code: admin.tenantId.code,
      },
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Tenant admin login error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;