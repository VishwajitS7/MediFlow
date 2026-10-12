/**
 * Synchronizes existing PATIENT user accounts with the clinical Patient directory.
 * Ensures that every PATIENT user in the system has a correlated Patient medical chart.
 *
 * Usage:
 *   node --env-file=.env scripts/sync-patient-accounts.mjs
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/sync-patient-accounts.mjs");
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

const db = mongoose.connection.db;
const usersCol = db.collection("users");
const patientsCol = db.collection("patients");

const year = new Date().getUTCFullYear();

// Find all PATIENT users
const patientUsers = await usersCol.find({ role: "PATIENT" }).toArray();
console.log(`Found ${patientUsers.length} PATIENT user account(s).`);

for (const user of patientUsers) {
  const email = (user.email || "").toLowerCase();
  const phone = user.phone;

  // Check if a patient record exists
  const query = [{ userId: user._id }];
  if (email) query.push({ email });
  if (phone) query.push({ phone });

  let existingPatient = await patientsCol.findOne({ $or: query });

  if (existingPatient) {
    if (!existingPatient.userId) {
      await patientsCol.updateOne({ _id: existingPatient._id }, { $set: { userId: user._id } });
      console.log(`Linked existing patient ${existingPatient.patientId} (${existingPatient.fullName}) to User ${email}`);
    } else {
      console.log(`Patient ${existingPatient.patientId} already linked to User ${email}`);
    }
  } else {
    // Determine next sequential ID
    const highest = await patientsCol
      .find({ patientId: { $regex: `^MED-${year}-` } })
      .sort({ patientId: -1 })
      .limit(1)
      .toArray();

    let seq = 1;
    if (highest.length > 0) {
      const match = highest[0].patientId.match(/^MED-\d{4}-(\d{5})$/);
      if (match) {
        seq = parseInt(match[1], 10) + 1;
      }
    }

    const patientId = `MED-${year}-${String(seq).padStart(5, "0")}`;
    const now = new Date();

    const newPatient = {
      patientId,
      fullName: user.name || "Patient",
      dateOfBirth: new Date("1995-01-01"),
      gender: "OTHER",
      phone: phone || "+1-555-0100",
      email: email || undefined,
      allergies: [],
      emergencyContact: {
        name: "Self",
        relationship: "Self",
        phone: phone || "+1-555-0100",
      },
      userId: user._id,
      createdAt: now,
      updatedAt: now,
    };

    await patientsCol.insertOne(newPatient);
    console.log(`Created & Linked new Patient ${patientId} for ${user.name} (${email})`);
  }
}

await mongoose.disconnect();
console.log("Synchronization complete.");
