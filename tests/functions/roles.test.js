import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";

// Runs inside `firebase emulators:exec`, which sets the *_EMULATOR_HOST variables
// so the Admin SDK talks to the emulators.
const PROJECT_ID = "demo-campussafe";
const PASSWORD = "Passw0rd!";

let adminApp, clientApp, auth, setUserRole;
const uids = {};

async function createUser(key, role) {
  const user = await getAdminAuth(adminApp).createUser({ email: `${key}@campussafe.test`, password: PASSWORD });
  if (role) await getAdminAuth(adminApp).setCustomUserClaims(user.uid, { role });
  uids[key] = user.uid;
}

async function signInAs(key) {
  await signOut(auth);
  await signInWithEmailAndPassword(auth, `${key}@campussafe.test`, PASSWORD);
}

beforeAll(async () => {
  adminApp = initializeAdminApp({ projectId: PROJECT_ID }, "admin");
  await createUser("admin", "admin");
  await createUser("student");
  await createUser("other");

  clientApp = initializeApp({ apiKey: "demo-key", projectId: PROJECT_ID }, "client");
  auth = getAuth(clientApp);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const functions = getFunctions(clientApp, "asia-southeast1");
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  setUserRole = httpsCallable(functions, "setUserRole");
});

afterAll(async () => {
  await deleteApp(clientApp);
  await deleteAdminApp(adminApp);
});

describe("setUserRole", () => {
  test("an admin can promote a student to responder", async () => {
    await signInAs("admin");
    const result = await setUserRole({ uid: uids.student, role: "responder" });
    expect(result.data).toEqual({ uid: uids.student, role: "responder" });

    const user = await getAdminAuth(adminApp).getUser(uids.student);
    expect(user.customClaims?.role).toBe("responder");
    const profile = await getAdminFirestore(adminApp).doc(`users/${uids.student}`).get();
    expect(profile.get("role")).toBe("responder");
  });

  test("a non-admin cannot change roles", async () => {
    await signInAs("other");
    await expect(setUserRole({ uid: uids.other, role: "admin" })).rejects.toMatchObject({
      code: "functions/permission-denied",
    });
  });

  test("invalid roles are rejected", async () => {
    await signInAs("admin");
    await expect(setUserRole({ uid: uids.other, role: "superuser" })).rejects.toMatchObject({
      code: "functions/invalid-argument",
    });
  });

  test("an admin cannot remove their own admin role", async () => {
    await signInAs("admin");
    await expect(setUserRole({ uid: uids.admin, role: "student" })).rejects.toMatchObject({
      code: "functions/failed-precondition",
    });
  });
});
