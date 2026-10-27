import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

export const ROLES = ["student", "responder", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Admin-only: changes a user's role (FR20).
 * The role is stored in two places that must stay in sync:
 *  - the Auth custom claim `role`, which Security Rules trust, and
 *  - users/{uid}.role, which the apps display.
 * The client of the affected user should refresh its ID token after this
 * (the apps do it when they see roleUpdatedAt change).
 */
export const setUserRole = onCall<{ uid?: unknown; role?: unknown }>(async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can change user roles.");
  }
  const { uid, role } = request.data ?? {};
  if (typeof uid !== "string" || uid.length === 0) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }
  if (!isRole(role)) {
    throw new HttpsError("invalid-argument", `role must be one of: ${ROLES.join(", ")}.`);
  }
  if (uid === request.auth.uid && role !== "admin") {
    throw new HttpsError("failed-precondition", "Admins cannot remove their own admin role.");
  }

  const auth = getAuth();
  const user = await auth.getUser(uid).catch(() => {
    throw new HttpsError("not-found", "User not found.");
  });
  await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), role });
  await getFirestore().doc(`users/${uid}`).set(
    { role, roleUpdatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return { uid, role };
});
