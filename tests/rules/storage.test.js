import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, test } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadBytes } from "firebase/storage";

let env;

const image = (bytes) => new Uint8Array(bytes);
const jpeg = { contentType: "image/jpeg" };

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-campussafe",
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), "incidents/stud1/inc1/existing.jpg"), image(10), jpeg);
  });
});

afterAll(async () => {
  await env?.cleanup();
});

describe("incident photos", () => {
  test("a reporter can upload a small image to their own folder", async () => {
    const storage = env.authenticatedContext("stud1").storage();
    await assertSucceeds(uploadBytes(ref(storage, "incidents/stud1/inc1/photo1.jpg"), image(1000), jpeg));
  });

  test("uploads over 1 MB are rejected", async () => {
    const storage = env.authenticatedContext("stud1").storage();
    await assertFails(uploadBytes(ref(storage, "incidents/stud1/inc1/big.jpg"), image(1024 * 1024 + 1), jpeg));
  });

  test("only images are accepted", async () => {
    const storage = env.authenticatedContext("stud1").storage();
    await assertFails(uploadBytes(ref(storage, "incidents/stud1/inc1/file.pdf"), image(10), { contentType: "application/pdf" }));
  });

  test("users cannot upload into another user's folder", async () => {
    const storage = env.authenticatedContext("stud2").storage();
    await assertFails(uploadBytes(ref(storage, "incidents/stud1/inc1/photo2.jpg"), image(10), jpeg));
  });

  test("reporter, responders and admins can view photos; other students cannot", async () => {
    const path = "incidents/stud1/inc1/existing.jpg";
    await assertSucceeds(getBytes(ref(env.authenticatedContext("stud1").storage(), path)));
    await assertSucceeds(getBytes(ref(env.authenticatedContext("resp1", { role: "responder" }).storage(), path)));
    await assertSucceeds(getBytes(ref(env.authenticatedContext("admin1", { role: "admin" }).storage(), path)));
    await assertFails(getBytes(ref(env.authenticatedContext("stud2").storage(), path)));
  });
});
