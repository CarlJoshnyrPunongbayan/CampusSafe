import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { notifyTopic, TOPICS } from "./notify.js";

const DEFAULT_ESCALATION_MINUTES = 2;

/**
 * Escalation rule (Table XI): a High-priority report still Pending and not acknowledged
 * after `config/app.escalationMinutes` (default 2) is flagged as escalated, which
 * highlights it on the dashboard and notifies the security office again.
 * Returns the ids of the incidents escalated in this run.
 */
export async function runEscalation(now: Date = new Date()): Promise<string[]> {
  const db = getFirestore();
  const config = await db.doc("config/app").get();
  const minutes = Number(config.get("escalationMinutes") ?? DEFAULT_ESCALATION_MINUTES);
  const cutoff = Timestamp.fromMillis(now.getTime() - minutes * 60_000);

  const overdue = await db
    .collection("incidents")
    .where("status", "==", "Pending")
    .where("priority", "==", "High")
    .where("escalated", "==", false)
    .where("createdAt", "<=", cutoff)
    .get();

  const escalated: string[] = [];
  for (const doc of overdue.docs) {
    if (doc.get("acknowledgedAt")) continue;
    await doc.ref.update({ escalated: true, escalatedAt: FieldValue.serverTimestamp() });
    escalated.push(doc.id);
    await notifyTopic(TOPICS.SECURITY_OFFICE, {
      title: "⚠️ Escalated: High priority report not acknowledged",
      body: `${String(doc.get("description") ?? "").slice(0, 100)} (waiting over ${minutes} min)`,
      data: { incidentId: doc.id, escalated: "true" },
    });
  }
  return escalated;
}

export const escalateUnacknowledged = onSchedule("every 1 minutes", async () => {
  await runEscalation();
});
