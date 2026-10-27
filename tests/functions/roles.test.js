import { beforeAll, describe, expect, test } from "vitest";
import { fnRequire } from "./setup.js";

const { getAuth } = fnRequire("firebase-admin/auth");
const { getFirestore } = fnRequire("firebase-admin/firestore");
const { setUserRole } = fnRequire("./lib/roles.js");

const uids = {};
const call = (asUid, role, data) => setUserRole.run({ auth: { uid: asUid, token: { role } }, data, rawRequest: {} });

beforeAll(async () => {
  for (const key of ["admin", "student", "other"]) {
    const email = `${key}-${Date.now()}@campussafe.test`;
    uids[key] = (await getAuth().createUser({ email, password: "Passw0rd!" })).uid;
  }
  await getAuth().setCustomUserClaims(uids.admin, { role: "admin" });
});

describe("setUserRole", () => {
  test("an admin can promote a student to responder", async () => {
    const result = await call(uids.admin, "admin", { uid: uids.student, role: "responder" });
    expect(result).toEqual({ uid: uids.student, role: "responder" });
    expect((await getAuth().getUser(uids.student)).customClaims?.role).toBe("responder");
    expect((await getFirestore().doc(`users/${uids.student}`).get()).get("role")).toBe("responder");
  });

  test("a non-admin cannot change roles", async () => {
    await expect(call(uids.other, undefined, { uid: uids.other, role: "admin" })).rejects.toMatchObject({ code: "permission-denied" });
  });

  test("invalid roles are rejected", async () => {
    await expect(call(uids.admin, "admin", { uid: uids.other, role: "superuser" })).rejects.toMatchObject({ code: "invalid-argument" });
  });

  test("unknown users are rejected", async () => {
    await expect(call(uids.admin, "admin", { uid: "nobody", role: "responder" })).rejects.toMatchObject({ code: "not-found" });
  });

  test("an admin cannot remove their own admin role", async () => {
    await expect(call(uids.admin, "admin", { uid: uids.admin, role: "student" })).rejects.toMatchObject({ code: "failed-precondition" });
  });
});
