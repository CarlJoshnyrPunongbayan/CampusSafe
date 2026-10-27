import { createRequire } from "node:module";

// Function handlers are invoked directly (handler.run) against the Auth and Firestore
// emulators, using the functions package's own firebase-admin copy.
// FUNCTIONS_EMULATOR makes notify.ts log push notifications instead of sending them.
process.env.FUNCTIONS_EMULATOR = "true";

export const fnRequire = createRequire(new URL("../../functions/package.json", import.meta.url));
const { getApps, initializeApp } = fnRequire("firebase-admin/app");
if (getApps().length === 0) initializeApp({ projectId: "demo-campussafe" });

export async function waitFor(fn, timeoutMs = 10000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > timeoutMs) throw new Error("Timed out");
    await new Promise((r) => setTimeout(r, 200));
  }
}
