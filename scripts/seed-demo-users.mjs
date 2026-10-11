/**
 * Seeds the four synthetic demo accounts used by the login page's "Quick Fill Demo Roles" buttons.
 *
 * Staff accounts can no longer be self-registered (only an ADMIN may create them), so local
 * development and demos bootstrap their first users with this script:
 *
 *   node --env-file=.env.local scripts/seed-demo-users.mjs
 *
 * Existing accounts are left untouched (insert-only). Refuses to run when NODE_ENV=production.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const DEMO_PASSWORD = "Password123!";
const DEMO_USERS = [
  { name: "Demo Admin", email: "admin@mediflow.local", role: "ADMIN" },
  { name: "Demo Doctor", email: "doctor@mediflow.local", role: "DOCTOR", specialization: "General Medicine" },
  { name: "Demo Receptionist", email: "receptionist@mediflow.local", role: "RECEPTIONIST" },
  { name: "Demo Patient", email: "patient@mediflow.local", role: "PATIENT" },
];

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed demo accounts with NODE_ENV=production.");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env.local scripts/seed-demo-users.mjs");
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
const users = mongoose.connection.collection("users");
const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

for (const user of DEMO_USERS) {
  const now = new Date();
  const result = await users.updateOne(
    { email: user.email },
    { $setOnInsert: { ...user, passwordHash, isActive: true, createdAt: now, updatedAt: now } },
    { upsert: true }
  );
  console.log(`${result.upsertedCount ? "created" : "exists "}  ${user.role.padEnd(12)} ${user.email}`);
}

await mongoose.disconnect();
