require("dotenv").config();
const mongoose = require("mongoose");
const PlatformAdmin = require("../models/PlatformAdmin");
const { createSalt, hashPassword } = require("../utils/authUtils");

const run = async () => {
  const email = String(process.env.RESET_PLATFORM_EMAIL || "admin@platform.com").trim().toLowerCase();
  const password = String(process.env.RESET_PLATFORM_PASSWORD || "admin12345");
  const name = String(process.env.RESET_PLATFORM_NAME || "Platform Admin").trim();

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  if (!email || !password || !name) {
    throw new Error("RESET_PLATFORM_EMAIL, RESET_PLATFORM_PASSWORD and RESET_PLATFORM_NAME must be non-empty");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const salt = createSalt();
  const hash = hashPassword(password, salt);

  const existing = await PlatformAdmin.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.passwordSalt = salt;
    existing.passwordHash = hash;
    existing.isActive = true;
    await existing.save();
    console.log("[reset-platform-admin] updated", { id: String(existing._id), email: existing.email });
  } else {
    const fallbackAny = await PlatformAdmin.findOne({});
    if (fallbackAny) {
      const previousEmail = fallbackAny.email;
      fallbackAny.name = name;
      fallbackAny.email = email;
      fallbackAny.passwordSalt = salt;
      fallbackAny.passwordHash = hash;
      fallbackAny.isActive = true;
      await fallbackAny.save();
      console.log("[reset-platform-admin] reassigned", {
        id: String(fallbackAny._id),
        previousEmail,
        email,
      });
    } else {
      const created = await PlatformAdmin.create({
        name,
        email,
        passwordSalt: salt,
        passwordHash: hash,
        isActive: true,
      });
      console.log("[reset-platform-admin] created", { id: String(created._id), email: created.email });
    }
  }

  await mongoose.disconnect();
  console.log("[reset-platform-admin] done");
};

run().catch(async (error) => {
  console.error("[reset-platform-admin] error", error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
