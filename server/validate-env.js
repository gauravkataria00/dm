#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * Run before deploying to production: node validate-env.js
 */

require("dotenv").config();

const errors = [];
const warnings = [];

console.log("\n📋 Environment Variable Validation\n");
console.log("========================================\n");

// Critical checks
const criticalVars = [
  { key: "JWT_SECRET", desc: "JWT signing secret" },
  { key: "NODE_ENV", desc: "Environment (production/development)" },
  { key: "DB_TYPE", desc: "Database type (mongodb)" },
];

const dbVars = {
  mongodb: [
    { key: "MONGODB_URI", desc: "MongoDB connection string" },
  ],
};

for (const { key, desc } of criticalVars) {
  if (!process.env[key]) {
    errors.push(`❌ Missing: ${key} - ${desc}`);
  } else {
    console.log(`✅ ${key} is set`);
  }
}

// Database-specific checks
const dbType = process.env.DB_TYPE || "mongodb";
const requiredForDb = dbVars[dbType] || [];
for (const { key, desc } of requiredForDb) {
  if (!process.env[key]) {
    errors.push(`❌ Missing: ${key} (for ${dbType}) - ${desc}`);
  } else {
    console.log(`✅ ${key} is set (${dbType})`);
  }
}

// Optional but recommended
const optionalVars = [
  { key: "PORT", default: "5000", desc: "Server port" },
  { key: "CORS_ALLOWED_ORIGINS", desc: "Allowed CORS origins" },
  { key: "RATE_LIMIT_MAX", default: "200", desc: "Rate limit requests" },
];

console.log("\n⭐ Optional Configuration:\n");
for (const { key, default: dflt, desc } of optionalVars) {
  const val = process.env[key];
  if (val) {
    console.log(`✅ ${key} = ${key === "MongoDB" ? "***" : val}`);
  } else {
    console.log(`ⓘ  ${key} not set (default: ${dflt || "none"}) - ${desc}`);
  }
}

// Production-specific checks
if (process.env.NODE_ENV === "production") {
  console.log("\n🚀 Production Checks:\n");
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push("⚠️  JWT_SECRET is too short (< 32 chars). Use a stronger secret.");
  }
  if (!process.env.JWT_SECRET) {
    errors.push("❌ JWT_SECRET MUST be set in production");
  }
}

// Summary
console.log("\n========================================\n");

if (errors.length > 0) {
  console.error(`\n❌ Found ${errors.length} error(s):\n`);
  errors.forEach(e => console.error(`  ${e}`));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn(`\n⚠️  Found ${warnings.length} warning(s):\n`);
  warnings.forEach(w => console.warn(`  ${w}`));
}

console.log("\n✅ All critical environment variables are set!\n");
console.log("📌 Next steps:");
console.log("  1. Verify JWT_SECRET is 32+ characters");
console.log("  2. Confirm MONGODB_URI connects successfully");
console.log("  3. Test /api/health endpoint when server starts");
console.log("  4. Check server logs for [AUTH] and [DB] prefixes\n");

process.exit(0);
