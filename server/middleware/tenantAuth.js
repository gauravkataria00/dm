const { verifyToken } = require("../utils/authUtils");

const platformTokenSecret =
  process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET || "change-this-platform-secret";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice(7).trim();
};

const requireTenantAuth = (req, res, next) => {
  try {
    const token = getBearerToken(req);
    const claims = verifyToken(token, platformTokenSecret);

    if (claims.role !== "tenant_admin" || !claims.tenantId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = {
      role: claims.role,
      tenantId: String(claims.tenantId),
      tenantCode: claims.tenantCode,
      adminId: String(claims.adminId || ""),
      id: String(claims.adminId || ""),
    };

    console.log("User:", req.user.id);

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = {
  requireTenantAuth,
};
