import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import User from "../models/User.js";

async function run() {
  await mongoose.connect(env.MONGO_URI);
  console.log("[createAdmin] connected");

  const email = "admin@birrtracker.et";
  const password = "Admin@12345";

  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    user.deletedAt = null;
    const hash = await bcrypt.hash(password, 12);
    user.password = hash;
    await user.save();
    console.log(`[createAdmin] existing user promoted to admin: ${email}`);
  } else {
    const hash = await bcrypt.hash(password, 12);
    user = await User.create({
      name: "System Admin",
      email,
      password: hash,
      role: "admin",
      emailVerified: true,
      onboarded: true,
      consentAcceptedAt: new Date(),
    });
    console.log(`[createAdmin] admin user created: ${email}`);
  }

  console.log(`[createAdmin] credentials: ${email} / ${password}`);
  await mongoose.disconnect();
  console.log("[createAdmin] done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
