// Starts the Firebase Emulator Suite. Data is saved to ./emulator-data when you stop
// the emulators (Ctrl+C) and loaded again next time, once that folder exists.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const args = ["emulators:start", "--project", "demo-campussafe", "--export-on-exit", "emulator-data"];
if (existsSync("emulator-data")) args.push("--import", "emulator-data");
// Extra options pass through, e.g. `npm run emulators -- --only auth,firestore`.
args.push(...process.argv.slice(2));

// shell: true so the `firebase` command is found on Windows as well.
const child = spawn("firebase", args, { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
