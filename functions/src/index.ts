import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();

// Closest Firebase region to the Philippines.
setGlobalOptions({ region: "asia-southeast1", maxInstances: 10 });

export { setUserRole } from "./roles.js";
export { onIncidentCreated, onIncidentUpdated } from "./incidents.js";
export { escalateUnacknowledged } from "./escalation.js";
export { onAlertCreated } from "./alerts.js";
