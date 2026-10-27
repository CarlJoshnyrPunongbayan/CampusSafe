import { getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logActivity } from "./activity.js";
import { notifyTopic, notifyUser, TOPICS } from "./notify.js";
import { tagPriority, type IncidentTypeRule } from "./priority.js";

/**
 * New report: tag its priority, start the activity log and notify the security office.
 * Workflow steps 1–3 (Section 5.1.5): user reports → system tags severity → dashboard notified.
 */
export const onIncidentCreated = onDocumentCreated("incidents/{incidentId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const incident = snap.data();
  const incidentId = event.params.incidentId;
  // Security Rules never let the app set priority, so a report that already has one was
  // written by an admin script (seed or import) and is left as it is.
  if (incident.priority) return;

  const typeSnap = incident.typeId ? await getFirestore().doc(`incidentTypes/${incident.typeId}`).get() : null;
  const type = typeSnap?.exists ? (typeSnap.data() as IncidentTypeRule) : null;
  const { priority, reason } = tagPriority(
    { isSOS: incident.isSOS === true, description: String(incident.description ?? "") },
    type,
  );

  await snap.ref.update({
    priority,
    priorityReason: reason,
    priorityConfirmed: false,
    assignedResponderId: null,
    escalated: false,
  });
  await logActivity(incidentId, {
    actorId: incident.reporterId,
    action: incident.isSOS ? "sos_requested" : "reported",
    to: priority,
    note: `Priority tagged ${priority}: ${reason}`,
  });

  const label = incident.isSOS ? "SOS" : type?.name ?? "Incident";
  await notifyTopic(TOPICS.SECURITY_OFFICE, {
    title: `${priority === "High" ? "🚨 " : ""}${priority} priority: ${label}`,
    body: String(incident.description ?? "").slice(0, 120) || "New report received",
    data: { incidentId, priority },
  });
});

/** Records every lifecycle change in the activity log and notifies the people involved. */
export const onIncidentUpdated = onDocumentUpdated("incidents/{incidentId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  const incidentId = event.params.incidentId;
  const actorId: string = after.updatedBy ?? "system";
  const jobs: Promise<unknown>[] = [];

  if (!before.acknowledgedAt && after.acknowledgedAt) {
    jobs.push(logActivity(incidentId, { actorId, action: "acknowledged" }));
    jobs.push(notifyUser(after.reporterId, {
      title: "Report received by Campus Security",
      body: "Security has acknowledged your report and is reviewing it.",
      data: { incidentId },
    }));
  }

  // The first priority write comes from onIncidentCreated; only log later changes.
  if (before.priority && before.priority !== after.priority) {
    jobs.push(logActivity(incidentId, { actorId, action: "priority_changed", from: before.priority, to: after.priority }));
  } else if (!before.priorityConfirmed && after.priorityConfirmed) {
    jobs.push(logActivity(incidentId, { actorId, action: "priority_confirmed", to: after.priority }));
  }

  if ((before.assignedResponderId ?? null) !== (after.assignedResponderId ?? null)) {
    jobs.push(logActivity(incidentId, {
      actorId,
      action: "responder_assigned",
      from: before.assignedResponderId ?? null,
      to: after.assignedResponderId ?? null,
    }));
    jobs.push(notifyUser(after.assignedResponderId, {
      title: `New ${after.priority ?? ""} priority assignment`.replace("  ", " "),
      body: String(after.description ?? "").slice(0, 120) || "You were assigned to an incident.",
      data: { incidentId },
    }));
  }

  if (before.status !== after.status) {
    jobs.push(logActivity(incidentId, { actorId, action: "status_changed", from: before.status, to: after.status }));
    const messages: Record<string, string> = {
      Responding: "A responder is on the way.",
      Resolved: "Your report has been marked as resolved.",
      Pending: "Your report is back in the queue.",
    };
    jobs.push(notifyUser(after.reporterId, {
      title: `Report ${String(after.status).toLowerCase()}`,
      body: messages[after.status] ?? `Status: ${after.status}`,
      data: { incidentId, status: String(after.status) },
    }));
  }

  if (!before.escalated && after.escalated) {
    jobs.push(logActivity(incidentId, { actorId: "system", action: "escalated", note: "Not acknowledged in time" }));
  }

  await Promise.all(jobs);
});
