import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

let env;

const student = () => env.authenticatedContext("stud1", { email: "stud1@campussafe.test" }).firestore();
const otherStudent = () => env.authenticatedContext("stud2", { email: "stud2@campussafe.test" }).firestore();
const responder = () => env.authenticatedContext("resp1", { role: "responder", email: "resp1@campussafe.test" }).firestore();
const otherResponder = () => env.authenticatedContext("resp2", { role: "responder" }).firestore();
const admin = () => env.authenticatedContext("admin1", { role: "admin", email: "admin1@campussafe.test" }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

function newIncident(overrides = {}) {
  return {
    reporterId: "stud1",
    typeId: "medical",
    description: "Student fainted near the library entrance",
    photoUrls: [],
    isSOS: false,
    location: { lat: 13.94, lng: 121.61, accuracy: 8 },
    locationTagId: null,
    status: "Pending",
    clientCreatedAt: new Date(),
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

async function seed(path, data) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-campussafe",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed("incidents/inc1", {
    ...newIncident(),
    createdAt: new Date(),
    priority: "High",
    assignedResponderId: "resp1",
  });
});

describe("users", () => {
  const profile = (overrides = {}) => ({
    name: "Juan Dela Cruz",
    studentId: "2023-00001",
    email: "stud1@campussafe.test",
    mobileNo: "09171234567",
    role: "student",
    createdAt: serverTimestamp(),
    ...overrides,
  });

  test("a student can register their own profile", async () => {
    await assertSucceeds(setDoc(doc(student(), "users/stud1"), profile()));
  });

  test("a student cannot register as admin or responder", async () => {
    await assertFails(setDoc(doc(student(), "users/stud1"), profile({ role: "admin" })));
    await assertFails(setDoc(doc(student(), "users/stud1"), profile({ role: "responder" })));
  });

  test("a user cannot create a profile for someone else", async () => {
    await assertFails(setDoc(doc(student(), "users/stud2"), profile()));
  });

  test("unauthenticated users cannot read profiles", async () => {
    await seed("users/stud1", profile({ createdAt: new Date() }));
    await assertFails(getDoc(doc(anon(), "users/stud1")));
  });

  test("students can read only their own profile", async () => {
    await seed("users/stud1", profile({ createdAt: new Date() }));
    await assertSucceeds(getDoc(doc(student(), "users/stud1")));
    await assertFails(getDoc(doc(otherStudent(), "users/stud1")));
  });

  test("a user can update contact details but not their role", async () => {
    await seed("users/stud1", profile({ createdAt: new Date() }));
    await assertSucceeds(updateDoc(doc(student(), "users/stud1"), { mobileNo: "09998887777" }));
    await assertFails(updateDoc(doc(student(), "users/stud1"), { role: "admin" }));
  });

  test("admins cannot change roles directly (must use setUserRole)", async () => {
    await seed("users/stud1", profile({ createdAt: new Date() }));
    await assertFails(updateDoc(doc(admin(), "users/stud1"), { role: "responder" }));
    await assertSucceeds(updateDoc(doc(admin(), "users/stud1"), { name: "Juan D. Cruz" }));
  });
});

describe("incidentTypes and locationTags", () => {
  const type = { name: "Fire", defaultPriority: "High", keywords: ["smoke"], active: true };

  test("any signed-in user can read incident types", async () => {
    await seed("incidentTypes/fire", type);
    await assertSucceeds(getDoc(doc(student(), "incidentTypes/fire")));
    await assertFails(getDoc(doc(anon(), "incidentTypes/fire")));
  });

  test("only admins can manage incident types", async () => {
    await assertFails(setDoc(doc(student(), "incidentTypes/fire"), type));
    await assertFails(setDoc(doc(responder(), "incidentTypes/fire"), type));
    await assertSucceeds(setDoc(doc(admin(), "incidentTypes/fire"), type));
  });

  test("incident types must use a valid priority", async () => {
    await assertFails(setDoc(doc(admin(), "incidentTypes/fire"), { ...type, defaultPriority: "Critical" }));
  });

  test("only admins can manage location tags", async () => {
    const tag = { name: "Library 2F", building: "Library", floor: "2", lat: 13.9, lng: 121.6 };
    await assertFails(setDoc(doc(student(), "locationTags/lib2"), tag));
    await assertSucceeds(setDoc(doc(admin(), "locationTags/lib2"), tag));
  });
});

describe("config", () => {
  test("signed-in users can read app config; only admins can change it", async () => {
    await seed("config/app", { securityHotline: "09170000000", escalationMinutes: 2 });
    await assertSucceeds(getDoc(doc(student(), "config/app")));
    await assertFails(updateDoc(doc(student(), "config/app"), { securityHotline: "0" }));
    await assertSucceeds(updateDoc(doc(admin(), "config/app"), { securityHotline: "09171112222" }));
  });
});

describe("incidents", () => {
  test("a student can submit a report", async () => {
    await assertSucceeds(addDoc(collection(student(), "incidents"), newIncident()));
  });

  test("a student cannot submit a report as someone else", async () => {
    await assertFails(addDoc(collection(student(), "incidents"), newIncident({ reporterId: "stud2" })));
  });

  test("a student cannot set priority, assignment or a non-Pending status", async () => {
    await assertFails(addDoc(collection(student(), "incidents"), newIncident({ priority: "High" })));
    await assertFails(addDoc(collection(student(), "incidents"), newIncident({ assignedResponderId: "resp1" })));
    await assertFails(addDoc(collection(student(), "incidents"), newIncident({ status: "Resolved" })));
  });

  test("a report can have at most 3 photos", async () => {
    await assertFails(addDoc(collection(student(), "incidents"), newIncident({ photoUrls: ["a", "b", "c", "d"] })));
  });

  test("reporters can read their own incidents and query them", async () => {
    await assertSucceeds(getDoc(doc(student(), "incidents/inc1")));
    await assertSucceeds(getDocs(query(collection(student(), "incidents"), where("reporterId", "==", "stud1"))));
  });

  test("other students cannot read someone else's incident", async () => {
    await assertFails(getDoc(doc(otherStudent(), "incidents/inc1")));
    await assertFails(getDocs(collection(otherStudent(), "incidents")));
  });

  test("only the assigned responder can read the incident", async () => {
    await assertSucceeds(getDoc(doc(responder(), "incidents/inc1")));
    await assertFails(getDoc(doc(otherResponder(), "incidents/inc1")));
  });

  test("admins can read all incidents", async () => {
    await assertSucceeds(getDocs(collection(admin(), "incidents")));
  });

  test("reporters cannot change their incident after submitting", async () => {
    await assertFails(updateDoc(doc(student(), "incidents/inc1"), { status: "Resolved" }));
    await assertFails(updateDoc(doc(student(), "incidents/inc1"), { priority: "Low" }));
  });

  test("the assigned responder can only move the status forward", async () => {
    await assertSucceeds(updateDoc(doc(responder(), "incidents/inc1"), { status: "Responding", respondingAt: serverTimestamp(), updatedBy: "resp1" }));
    await assertFails(updateDoc(doc(responder(), "incidents/inc1"), { priority: "Low", updatedBy: "resp1" }));
    await assertFails(updateDoc(doc(responder(), "incidents/inc1"), { status: "Pending", updatedBy: "resp1" }));
    await assertFails(updateDoc(doc(otherResponder(), "incidents/inc1"), { status: "Responding", updatedBy: "resp2" }));
  });

  test("admins can acknowledge, assign and change priority", async () => {
    await assertSucceeds(updateDoc(doc(admin(), "incidents/inc1"), {
      acknowledgedAt: serverTimestamp(),
      assignedResponderId: "resp2",
      priority: "Medium",
      priorityConfirmed: true,
      updatedBy: "admin1",
    }));
  });

  test("staff updates must record who made them", async () => {
    await assertFails(updateDoc(doc(admin(), "incidents/inc1"), { status: "Responding" }));
    await assertFails(updateDoc(doc(admin(), "incidents/inc1"), { status: "Responding", updatedBy: "someone-else" }));
    await assertSucceeds(updateDoc(doc(admin(), "incidents/inc1"), { status: "Responding", updatedBy: "admin1" }));
  });

  test("admins cannot set an invalid priority or overwrite system fields", async () => {
    await assertFails(updateDoc(doc(admin(), "incidents/inc1"), { priority: "Critical", updatedBy: "admin1" }));
    await assertFails(updateDoc(doc(admin(), "incidents/inc1"), { priorityReason: "x", updatedBy: "admin1" }));
  });

  test("admins cannot rewrite who reported an incident or use an invalid status", async () => {
    await assertFails(updateDoc(doc(admin(), "incidents/inc1"), { reporterId: "stud2", updatedBy: "admin1" }));
    await assertFails(updateDoc(doc(admin(), "incidents/inc1"), { status: "Closed", updatedBy: "admin1" }));
  });
});

describe("incident chat", () => {
  const msg = (senderId) => ({ senderId, text: "Security is on the way.", sentAt: serverTimestamp() });

  test("reporter, assigned responder and admin can chat", async () => {
    await assertSucceeds(addDoc(collection(student(), "incidents/inc1/messages"), msg("stud1")));
    await assertSucceeds(addDoc(collection(responder(), "incidents/inc1/messages"), msg("resp1")));
    await assertSucceeds(addDoc(collection(admin(), "incidents/inc1/messages"), msg("admin1")));
    await assertSucceeds(getDocs(collection(student(), "incidents/inc1/messages")));
  });

  test("other users cannot read or post in the chat", async () => {
    await assertFails(getDocs(collection(otherStudent(), "incidents/inc1/messages")));
    await assertFails(addDoc(collection(otherStudent(), "incidents/inc1/messages"), msg("stud2")));
    await assertFails(addDoc(collection(otherResponder(), "incidents/inc1/messages"), msg("resp2")));
  });

  test("users cannot post messages as someone else", async () => {
    await assertFails(addDoc(collection(student(), "incidents/inc1/messages"), msg("admin1")));
  });
});

describe("activity logs", () => {
  test("only admins can read logs and no client can write them", async () => {
    await seed("incidents/inc1/activityLogs/l1", { action: "created", at: new Date() });
    await assertSucceeds(getDoc(doc(admin(), "incidents/inc1/activityLogs/l1")));
    await assertFails(getDoc(doc(student(), "incidents/inc1/activityLogs/l1")));
    await assertFails(setDoc(doc(admin(), "incidents/inc1/activityLogs/l2"), { action: "fake" }));
  });
});

describe("alerts", () => {
  const alert = (sentBy) => ({ title: "Fire drill", body: "Proceed to the open field.", severity: "Info", sentBy, sentAt: serverTimestamp() });

  test("only admins can broadcast alerts", async () => {
    await assertSucceeds(addDoc(collection(admin(), "alerts"), alert("admin1")));
    await assertFails(addDoc(collection(student(), "alerts"), alert("stud1")));
    await assertFails(addDoc(collection(responder(), "alerts"), alert("resp1")));
  });

  test("all signed-in users can read alerts", async () => {
    await seed("alerts/a1", { ...alert("admin1"), sentAt: new Date() });
    await assertSucceeds(getDoc(doc(student(), "alerts/a1")));
    await assertFails(getDoc(doc(anon(), "alerts/a1")));
  });
});
