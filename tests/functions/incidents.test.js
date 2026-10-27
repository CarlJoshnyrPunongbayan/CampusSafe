import { beforeAll, describe, expect, test } from "vitest";
import { fnRequire } from "./setup.js";

const { getFirestore, Timestamp, FieldValue } = fnRequire("firebase-admin/firestore");
const { onIncidentCreated, onIncidentUpdated } = fnRequire("./lib/incidents.js");
const { runEscalation } = fnRequire("./lib/escalation.js");
const { onAlertCreated } = fnRequire("./lib/alerts.js");

let db;

const logs = async (id) => (await db.collection(`incidents/${id}/activityLogs`).orderBy("at").get()).docs.map((d) => d.data());

function incident(overrides = {}) {
  return {
    reporterId: "stud1",
    typeId: "theft",
    description: "Phone stolen at the canteen",
    photoUrls: [],
    isSOS: false,
    location: { lat: 13.94, lng: 121.61, accuracy: 10 },
    locationTagId: null,
    status: "Pending",
    clientCreatedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    ...overrides,
  };
}

/** Writes an incident and runs onIncidentCreated on it, as the trigger would. */
async function report(overrides) {
  const ref = await db.collection("incidents").add(incident(overrides));
  await onIncidentCreated.run({ params: { incidentId: ref.id }, data: await ref.get() });
  return ref;
}

/** Applies an update and runs onIncidentUpdated with the before/after snapshots. */
async function change(ref, data) {
  const before = await ref.get();
  await ref.update(data);
  const after = await ref.get();
  await onIncidentUpdated.run({ params: { incidentId: ref.id }, data: { before, after } });
}

beforeAll(async () => {
  db = getFirestore();
  await db.doc("incidentTypes/theft").set({ name: "Theft", defaultPriority: "Medium", keywords: ["knife"], active: true });
  await db.doc("config/app").set({ escalationMinutes: 2, securityHotline: "09170000000" });
});

describe("onIncidentCreated", () => {
  test("tags priority from the incident type and starts the activity log", async () => {
    const ref = await report();
    expect((await ref.get()).data()).toMatchObject({
      priority: "Medium",
      priorityReason: "Default for Theft",
      priorityConfirmed: false,
      escalated: false,
      assignedResponderId: null,
    });
    const [entry] = await logs(ref.id);
    expect(entry).toMatchObject({ action: "reported", actorId: "stud1", to: "Medium" });
  });

  test("keywords and SOS raise the priority to High", async () => {
    expect((await (await report({ description: "Man with a knife" })).get()).get("priority")).toBe("High");
    const sos = await report({ isSOS: true, description: "" });
    expect((await sos.get()).get("priority")).toBe("High");
    expect((await logs(sos.id))[0].action).toBe("sos_requested");
  });

  test("leaves incidents that already have a priority untouched (seeded or imported data)", async () => {
    const ref = await report({ priority: "Low", assignedResponderId: "resp1" });
    expect((await ref.get()).data()).toMatchObject({ priority: "Low", assignedResponderId: "resp1" });
    expect(await logs(ref.id)).toEqual([]);
  });

  test("an unknown incident type falls back to Medium", async () => {
    expect((await (await report({ typeId: "does-not-exist" })).get()).get("priority")).toBe("Medium");
  });
});

describe("onIncidentUpdated", () => {
  test("logs acknowledge, assignment, priority and status changes with the actor", async () => {
    const ref = await report();
    await change(ref, { acknowledgedAt: FieldValue.serverTimestamp(), assignedResponderId: "resp1", updatedBy: "admin1" });
    await change(ref, { priority: "High", priorityConfirmed: true, updatedBy: "admin1" });
    await change(ref, { status: "Responding", respondingAt: FieldValue.serverTimestamp(), updatedBy: "resp1" });
    await change(ref, { status: "Resolved", resolvedAt: FieldValue.serverTimestamp(), updatedBy: "resp1" });

    const actions = (await logs(ref.id)).map((e) => `${e.action}:${e.actorId}:${e.from ?? ""}>${e.to ?? ""}`);
    expect(actions).toEqual([
      "reported:stud1:>Medium",
      "acknowledged:admin1:>",
      "responder_assigned:admin1:>resp1",
      "priority_changed:admin1:Medium>High",
      "status_changed:resp1:Pending>Responding",
      "status_changed:resp1:Responding>Resolved",
    ]);
  });

  test("confirming the tagged priority without changing it is logged", async () => {
    const ref = await report();
    await change(ref, { priorityConfirmed: true, updatedBy: "admin1" });
    expect((await logs(ref.id)).map((e) => e.action)).toEqual(["reported", "priority_confirmed"]);
  });
});

describe("runEscalation (Table XI)", () => {
  test("escalates only High, Pending, unacknowledged reports older than the limit", async () => {
    const old = Timestamp.fromMillis(Date.now() - 3 * 60_000);
    const overdue = await report({ description: "knife", createdAt: old });
    const recent = await report({ description: "knife" });
    const acknowledged = await report({ description: "knife", createdAt: old });
    await acknowledged.update({ acknowledgedAt: old });
    const medium = await report({ createdAt: old });
    const responding = await report({ description: "knife", createdAt: old });
    await responding.update({ status: "Responding" });

    const escalated = await runEscalation();
    expect(escalated).toContain(overdue.id);
    for (const ref of [recent, acknowledged, medium, responding]) expect(escalated).not.toContain(ref.id);
    expect((await overdue.get()).data()).toMatchObject({ escalated: true });
    expect((await overdue.get()).get("escalatedAt")).toBeDefined();

    // Running again does not escalate the same report twice.
    expect(await runEscalation()).not.toContain(overdue.id);
  });

  test("respects config/app.escalationMinutes", async () => {
    await db.doc("config/app").set({ escalationMinutes: 10 }, { merge: true });
    const ref = await report({ description: "knife", createdAt: Timestamp.fromMillis(Date.now() - 5 * 60_000) });
    expect(await runEscalation()).not.toContain(ref.id);
    await db.doc("config/app").set({ escalationMinutes: 2 }, { merge: true });
    expect(await runEscalation()).toContain(ref.id);
  });
});

describe("onAlertCreated", () => {
  test("runs without error for a broadcast alert", async () => {
    const ref = await db.collection("alerts").add({ title: "Drill", body: "Fire drill at 2 PM", severity: "Info", sentBy: "admin1", sentAt: Timestamp.now() });
    await expect(onAlertCreated.run({ params: { alertId: ref.id }, data: await ref.get() })).resolves.toBeUndefined();
  });
});
