import { FieldValue, getFirestore } from "firebase-admin/firestore";

export interface ActivityEntry {
  actorId: string;
  action: string;
  from?: string | null;
  to?: string | null;
  note?: string;
}

/** incidents/{id}/activityLogs: the audit trail shown on the dashboard. Written only here. */
export function logActivity(incidentId: string, entry: ActivityEntry) {
  return getFirestore()
    .collection(`incidents/${incidentId}/activityLogs`)
    .add({ ...entry, at: FieldValue.serverTimestamp() });
}
