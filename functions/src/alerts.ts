import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { notifyTopic, TOPICS } from "./notify.js";

/** Broadcast alert created on the dashboard → push notification to every app user. */
export const onAlertCreated = onDocumentCreated("alerts/{alertId}", async (event) => {
  const alert = event.data?.data();
  if (!alert) return;
  const icon = alert.severity === "Emergency" ? "🚨 " : alert.severity === "Warning" ? "⚠️ " : "";
  await notifyTopic(TOPICS.ALL_USERS, {
    title: `${icon}${alert.title}`,
    body: alert.body,
    data: { alertId: event.params.alertId, severity: String(alert.severity) },
  });
});
