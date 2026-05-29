import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
import { User } from "../src/models/User.js";

dotenv.config();

async function setupAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not set in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("✓ Admin account already exists");
      console.log(`Email: ${existingAdmin.email}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Generate a secure temporary password
    const tempPassword = crypto.randomBytes(12).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const admin = await User.create({
      fullName: "System Administrator",
      email: process.env.ADMIN_EMAIL || "admin@nexii-studio.com",
      password: hashedPassword,
      role: "admin",
      accountStatus: "active"
    });

    console.log(`
╔════════════════════════════════════════════╗
║     ADMIN ACCOUNT CREATED SUCCESSFULLY      ║
╚════════════════════════════════════════════╝

📧 Email:    ${admin.email}
🔐 Password: ${tempPassword}

⚠️  IMPORTANT SECURITY NOTES:
   • Save this password securely in your password manager
   • Change this password immediately after first login
   • Never share this password via email or chat
   • Delete this script after running it

🔗 Login URL: https://your-production-domain.com/login
    `);

    // Log this action for audit trail
    console.log(`[${new Date().toISOString()}] Admin account created by setup script`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

setupAdmin();