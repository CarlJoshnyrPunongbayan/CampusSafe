// Seeds CampusSafe with reference data and test accounts.
//
// Emulator (default):   npm run emulators   (in one terminal)
//                       npm run seed        (in another)
// With demo data:       npm run seed -- --demo   (emulator only: sample users, incidents, alerts)
// Real project:         GOOGLE_APPLICATION_CREDENTIALS=key.json node scripts/seed.js --project <id> --production
//                       In production only reference data and the first admin are created.

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { seedDemoData } from "./demo-data.js";

const args = process.argv.slice(2);
const production = args.includes("--production");
const demo = args.includes("--demo");
const projectId = args.includes("--project") ? args[args.indexOf("--project") + 1] : "demo-campussafe";

if (!production) {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
}

initializeApp({ projectId });
const auth = getAuth();
const db = getFirestore();

// Default priority comes from the type; keywords in the description raise a report to High
// (rule-based priority tagging, FR08 / Table X). Admins can edit these in the dashboard.
const incidentTypes = [
  { id: "medical", name: "Medical Emergency", defaultPriority: "High", keywords: ["unconscious", "fainted", "not breathing", "seizure", "bleeding", "chest pain"] },
  { id: "fire", name: "Fire / Smoke", defaultPriority: "High", keywords: ["fire", "smoke", "burning", "explosion"] },
  { id: "violence", name: "Violence / Assault", defaultPriority: "High", keywords: ["weapon", "knife", "gun", "stabbed", "fight", "assault"] },
  { id: "accident", name: "Accident / Injury", defaultPriority: "Medium", keywords: ["bleeding", "unconscious", "fracture", "head injury"] },
  { id: "harassment", name: "Harassment / Bullying", defaultPriority: "Medium", keywords: ["threat", "weapon", "following me"] },
  { id: "theft", name: "Theft / Robbery", defaultPriority: "Medium", keywords: ["robbery", "weapon", "snatched"] },
  { id: "suspicious", name: "Suspicious Person / Activity", defaultPriority: "Medium", keywords: ["weapon", "intruder", "trespassing"] },
  { id: "hazard", name: "Facility Hazard", defaultPriority: "Low", keywords: ["exposed wire", "electrical", "spark", "gas leak", "collapsed"] },
  { id: "other", name: "Other", defaultPriority: "Low", keywords: ["emergency", "help"] },
];

// Sample tags only. Replace names and coordinates with surveyed points on the MSEUF
// main campus before printing QR codes.
const CAMPUS = { lat: 13.9411, lng: 121.6139 };
const locationTags = [
  { id: "main-gate", name: "Main Gate", building: "Main Gate", floor: "G" },
  { id: "library-1f", name: "Library, Ground Floor", building: "Library", floor: "1" },
  { id: "ccms-2f", name: "CCMS Building, 2nd Floor", building: "CCMS Building", floor: "2" },
  { id: "gym", name: "Gymnasium", building: "Gymnasium", floor: "1" },
  { id: "canteen", name: "Canteen", building: "Canteen", floor: "1" },
].map((tag, i) => ({ ...tag, lat: CAMPUS.lat + i * 0.0003, lng: CAMPUS.lng + i * 0.0003 }));

const accounts = [
  { email: "admin@campussafe.test", password: "Admin123!", name: "Security Office (Admin)", mobileNo: "09170000001", role: "admin" },
  { email: "responder@campussafe.test", password: "Respond123!", name: "Guard Responder", mobileNo: "09170000002", role: "responder" },
  { email: "student@campussafe.test", password: "Student123!", name: "Juan Dela Cruz", mobileNo: "09170000003", role: "student", studentId: "2023-00001" },
];

async function upsertAccount({ email, password, name, mobileNo, role, studentId }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, displayName: name });
  }
  await auth.setCustomUserClaims(user.uid, { role });
  await db.doc(`users/${user.uid}`).set(
    { name, email, mobileNo, role, ...(studentId ? { studentId } : {}), createdAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  console.log(`  ${role.padEnd(9)} ${email}${production ? "" : `  /  ${password}`}`);
  return user.uid;
}

async function main() {
  console.log(`Seeding ${production ? "PRODUCTION" : "emulator"} project "${projectId}"`);

  const batch = db.batch();
  for (const { id, ...type } of incidentTypes) batch.set(db.doc(`incidentTypes/${id}`), { ...type, active: true });
  for (const { id, ...tag } of locationTags) batch.set(db.doc(`locationTags/${id}`), tag);
  batch.set(db.doc("config/app"), { securityHotline: "09170000000", escalationMinutes: 2 }, { merge: true });
  await batch.commit();
  console.log(`  ${incidentTypes.length} incident types, ${locationTags.length} location tags, config/app`);

  if (production) {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) {
      await upsertAccount({ email, password, name: "Security Office", mobileNo: process.env.ADMIN_MOBILE ?? "", role: "admin" });
    } else {
      console.log("  Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin account.");
    }
  } else {
    const uids = [];
    for (const account of accounts) uids.push(await upsertAccount(account));
    if (demo) await seedDemoData({ db, auth, campus: CAMPUS, adminUid: uids[0] });
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
