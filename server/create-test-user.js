const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      tls: true,
      retryWrites: true
    });
    console.log("✅ Connected to MongoDB");

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("⚠️  Test user already exists!");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create test user
    const hashedPassword = await bcrypt.hash("password123", 12);
    const testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: hashedPassword
    });

    console.log("✅ Test user created successfully!");
    console.log("\n📝 Login Credentials:");
    console.log("   Email: test@example.com");
    console.log("   Password: password123");
    console.log("\n💡 You can now login using these credentials.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test user:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTestUser();
