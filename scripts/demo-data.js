// Demo data for presentations and screenshots (emulator only): sample students and
// responders, about 60 incidents spread over 30 days with realistic response times,
// activity logs, chat messages, alerts and measurement data.

import { createRequire } from "node:module";
import { Timestamp } from "firebase-admin/firestore";

const require = createRequire(import.meta.url);
let tagPriority;
try {
  ({ tagPriority } = require("../functions/lib/priority.js"));
} catch {
  console.error("Build the functions first: npm --prefix functions run build");
  process.exit(1);
}

// Small deterministic random generator so every run creates the same data.
let seed = 20260417;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (min, max) => min + rand() * (max - min);

const STUDENTS = [
  ["Maria Santos", "2023-10421"], ["Jose Reyes", "2022-08812"], ["Angela Cruz", "2024-01377"],
  ["Mark Villanueva", "2023-05530"], ["Kristine Garcia", "2022-11094"], ["Paolo Mendoza", "2024-02218"],
  ["Bea Ramos", "2023-07763"], ["John Aquino", "2022-03345"], ["Lea Bautista", "2024-04682"],
  ["Carlo Navarro", "2023-09917"], ["Ella Torres", "2022-06258"], ["Miguel Flores", "2024-00731"],
];
const RESPONDERS = ["Ramon Dela Peña", "Grace Soriano", "Allan Castillo"];

const DESCRIPTIONS = {
  medical: ["Student fainted during PE class at the gym.", "Classmate is having chest pain and difficulty breathing.", "Student feels dizzy and is vomiting near the canteen.", "Student had a seizure in the hallway, now conscious."],
  fire: ["Smoke coming from the electrical room on the 2nd floor.", "Burning smell near the canteen kitchen.", "Small fire in a trash bin outside the library."],
  violence: ["Two students in a fight near the main gate.", "A student was punched behind the gym.", "Group fight at the parking area, one person has a knife."],
  accident: ["Student slipped on the wet stairs and hurt their ankle.", "Motorcycle hit a student at the parking lot, bleeding from the leg.", "Student fell from the stage during practice."],
  harassment: ["Someone keeps following me around the campus after class.", "Student is being bullied and threatened in the CR.", "Received threatening messages from a classmate."],
  theft: ["My phone was stolen from my bag in the library.", "Laptop missing from the computer lab.", "Wallet snatched near the canteen."],
  suspicious: ["Unknown person taking photos of students near the gate.", "Man without ID wandering in the CCMS building.", "Suspicious bag left unattended at the lobby."],
  hazard: ["Exposed wire near the 3rd floor stairs.", "Broken glass door at the library entrance.", "Ceiling leak above the hallway, floor is slippery.", "Broken handrail on the gym bleachers."],
  other: ["Lost child near the main gate looking for their parent.", "Stray dogs chasing students at the field."],
};
const TYPE_WEIGHTS = ["theft", "theft", "theft", "hazard", "hazard", "hazard", "suspicious", "suspicious", "medical", "medical", "accident", "accident", "harassment", "harassment", "violence", "fire", "other"];

const MINUTE = 60_000;

export async function seedDemoData({ db, auth, campus, adminUid }) {
  const batchWrites = [];
  const write = (ref, data) => batchWrites.push([ref, data]);

  // ---- users ----
  const studentIds = [];
  for (const [i, [name, studentId]] of STUDENTS.entries()) {
    const email = `${name.split(" ")[0].toLowerCase()}.${i}@campussafe.test`;
    const uid = await upsertUser(auth, email, name);
    await auth.setCustomUserClaims(uid, { role: "student" });
    write(db.doc(`users/${uid}`), { name, studentId, email, mobileNo: `0917${String(1000000 + i * 7919).slice(-7)}`, role: "student", createdAt: Timestamp.fromMillis(Date.now() - (40 + i) * 86_400_000) });
    studentIds.push(uid);
  }
  const responderIds = [];
  for (const [i, name] of RESPONDERS.entries()) {
    const email = `${name.split(" ")[0].toLowerCase()}.responder@campussafe.test`;
    const uid = await upsertUser(auth, email, name);
    await auth.setCustomUserClaims(uid, { role: "responder" });
    write(db.doc(`users/${uid}`), { name, email, mobileNo: `0918${String(2000000 + i * 104729).slice(-7)}`, role: "responder", createdAt: Timestamp.fromMillis(Date.now() - 60 * 86_400_000) });
    responderIds.push(uid);
  }

  const types = Object.fromEntries((await db.collection("incidentTypes").get()).docs.map((d) => [d.id, d.data()]));
  const tags = (await db.collection("locationTags").get()).docs.map((d) => d.id);

  // ---- incidents ----
  const now = Date.now();
  let count = 0;
  const addIncident = ({ ageMin, typeId, isSOS = false, status, ackAfterMin, respondAfterMin, resolveAfterMin, escalated = false, description }) => {
    const ref = db.collection("incidents").doc();
    const created = now - ageMin * MINUTE;
    const type = types[typeId];
    const desc = isSOS ? "" : description ?? pick(DESCRIPTIONS[typeId]);
    const { priority, reason } = tagPriority({ isSOS, description: desc }, type ?? null);
    const reporterId = pick(studentIds);
    const responderId = status !== "Pending" || ackAfterMin != null ? pick(responderIds) : null;
    const useTag = rand() < 0.55 && tags.length > 0;
    const at = (min) => (min == null ? null : Timestamp.fromMillis(created + min * MINUTE));
    const data = {
      reporterId,
      typeId: isSOS ? "other" : typeId,
      description: desc,
      photoUrls: [],
      isSOS,
      location: { lat: campus.lat + between(-0.0012, 0.0012), lng: campus.lng + between(-0.0012, 0.0012), accuracy: Math.round(between(4, 26)) },
      locationTagId: useTag ? pick(tags) : null,
      status,
      priority,
      priorityReason: reason,
      priorityConfirmed: ackAfterMin != null,
      assignedResponderId: responderId,
      escalated,
      clientCreatedAt: Timestamp.fromMillis(created - Math.round(between(2, 9)) * 1000),
      createdAt: Timestamp.fromMillis(created),
      updatedBy: adminUid,
      ...(ackAfterMin != null && { acknowledgedAt: at(ackAfterMin) }),
      ...(respondAfterMin != null && { respondingAt: at(respondAfterMin) }),
      ...(resolveAfterMin != null && { resolvedAt: at(resolveAfterMin) }),
      ...(escalated && { escalatedAt: at(2) }),
    };
    write(ref, data);

    const logs = [{ actorId: reporterId, action: isSOS ? "sos_requested" : "reported", to: priority, note: `Priority tagged ${priority}: ${reason}`, at: at(0) }];
    if (escalated) logs.push({ actorId: "system", action: "escalated", note: "Not acknowledged in time", at: at(2) });
    if (ackAfterMin != null) {
      logs.push({ actorId: adminUid, action: "acknowledged", at: at(ackAfterMin) });
      logs.push({ actorId: adminUid, action: "priority_confirmed", to: priority, at: at(ackAfterMin) });
      logs.push({ actorId: adminUid, action: "responder_assigned", from: null, to: responderId, at: at(ackAfterMin + 0.3) });
    }
    if (respondAfterMin != null) logs.push({ actorId: responderId, action: "status_changed", from: "Pending", to: "Responding", at: at(respondAfterMin) });
    if (resolveAfterMin != null) logs.push({ actorId: responderId, action: "status_changed", from: "Responding", to: "Resolved", at: at(resolveAfterMin) });
    for (const log of logs) write(ref.collection("activityLogs").doc(), log);

    if (ackAfterMin != null && rand() < 0.35) {
      write(ref.collection("messages").doc(), { senderId: adminUid, text: "Campus Security here. We received your report. Are you safe right now?", sentAt: at(ackAfterMin + 0.5) });
      write(ref.collection("messages").doc(), { senderId: reporterId, text: "Yes, I'm okay. I'm waiting near the entrance.", sentAt: at(ackAfterMin + 1.2) });
      write(ref.collection("messages").doc(), { senderId: adminUid, text: "A responder is on the way. Please stay where you are.", sentAt: at(ackAfterMin + 1.6) });
    }

    // Measured report → dashboard display time (Table XII).
    if (count++ % 2 === 0) {
      write(db.collection("metrics").doc(), { kind: "dashboard_display_ms", value: Math.round(between(700, 3600)), refId: ref.id, uid: adminUid, recordedAt: at(0.05) });
    }
    return ref;
  };

  // History: resolved incidents over the last 30 days.
  for (let i = 0; i < 52; i++) {
    const typeId = pick(TYPE_WEIGHTS);
    const ack = between(0.4, typeId === "hazard" ? 6 : 2.6);
    const respond = ack + between(0.5, 4);
    addIncident({
      ageMin: between(60 * 6, 60 * 24 * 30),
      typeId,
      isSOS: rand() < 0.06,
      status: "Resolved",
      ackAfterMin: ack,
      respondAfterMin: respond,
      resolveAfterMin: respond + between(5, 55),
    });
  }
  // Earlier today.
  for (let i = 0; i < 4; i++) {
    const ack = between(0.5, 2);
    addIncident({ ageMin: between(60, 300), typeId: pick(TYPE_WEIGHTS), status: "Resolved", ackAfterMin: ack, respondAfterMin: ack + 2, resolveAfterMin: ack + between(10, 40) });
  }
  // Live queue right now.
  addIncident({ ageMin: 6, typeId: "violence", status: "Pending", escalated: true, description: "Group fight at the parking area, one person has a knife." });
  addIncident({ ageMin: 1.5, typeId: "other", isSOS: true, status: "Pending" });
  addIncident({ ageMin: 4, typeId: "suspicious", status: "Pending", description: "Man without ID wandering in the CCMS building." });
  addIncident({ ageMin: 9, typeId: "hazard", status: "Pending", description: "Ceiling leak above the hallway, floor is slippery." });
  addIncident({ ageMin: 14, typeId: "medical", status: "Responding", ackAfterMin: 0.8, respondAfterMin: 2.1, description: "Student fainted during PE class at the gym." });
  addIncident({ ageMin: 22, typeId: "theft", status: "Responding", ackAfterMin: 1.9, respondAfterMin: 6, description: "Laptop missing from the computer lab." });

  // ---- alerts ----
  const alerts = [
    { title: "Fire drill this Friday", body: "A campus-wide fire drill will be held on Friday at 2:00 PM. Proceed calmly to the nearest assembly area when the alarm sounds.", severity: "Info", ago: 3 * 86_400_000 },
    { title: "Heavy rain advisory", body: "Expect flooding near the north parking area. Use the main gate and avoid the covered walkway beside the field.", severity: "Warning", ago: 26 * 3_600_000 },
    { title: "Suspicious person near the main gate", body: "Security is checking a report of an unidentified person near the main gate. Avoid the area and report sightings through CampusSafe.", severity: "Warning", ago: 40 * MINUTE },
  ];
  for (const a of alerts) write(db.collection("alerts").doc(), { title: a.title, body: a.body, severity: a.severity, sentBy: adminUid, sentAt: Timestamp.fromMillis(now - a.ago) });

  for (let i = 0; i < batchWrites.length; i += 400) {
    const batch = db.batch();
    for (const [ref, data] of batchWrites.slice(i, i + 400)) batch.set(ref, data);
    await batch.commit();
  }
  console.log(`  demo: ${STUDENTS.length} students, ${RESPONDERS.length} responders, ${count} incidents, ${alerts.length} alerts`);
}

async function upsertUser(auth, email, displayName) {
  try {
    return (await auth.getUserByEmail(email)).uid;
  } catch {
    return (await auth.createUser({ email, password: "Demo1234!", displayName })).uid;
  }
}
