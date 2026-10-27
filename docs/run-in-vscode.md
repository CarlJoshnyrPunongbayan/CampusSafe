# Running CampusSafe in VS Code

Everything runs on your own computer with the **Firebase Emulator Suite** (a local copy of Firebase). No Firebase account, internet project or payment is needed for development.

## 1. Install the tools (once)

| Tool | Why | Get it |
|---|---|---|
| **Git** | Download the code | <https://git-scm.com/downloads> |
| **Node.js 22 LTS** | Runs the website, the backend code and the scripts | <https://nodejs.org/> (choose the LTS installer) |
| **Java 21** (JDK) | The Firebase emulators need Java | <https://adoptium.net/> (Temurin 21, tick "Set JAVA_HOME") |
| **Firebase CLI** | Starts the emulators | In a terminal: `npm install -g firebase-tools` |
| **VS Code** | Editor | <https://code.visualstudio.com/> |
| Flutter SDK *(only for the mobile app)* | Runs the app | <https://docs.flutter.dev/get-started/install>, plus Android Studio for the Android emulator |

Check them in a new terminal:

```bash
git --version
node -v          # v22.x
java -version    # 21 or newer
firebase --version
```

> Windows: if `firebase` is "not recognized", close and reopen VS Code after installing. If PowerShell blocks scripts, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use the **Command Prompt** terminal in VS Code.

## 2. Get the code and open it

```bash
git clone https://github.com/CarlJoshnyrPunongbayan/campussafe.git
cd campussafe
code .
```

When VS Code asks, click **Install** for the recommended extensions (Flutter, Dart, Tailwind CSS, Firebase rules highlighting, Vitest).

## 3. Install the project's packages (once, and after each `git pull`)

Open the terminal in VS Code (**Terminal → New Terminal**) and run:

```bash
npm run setup
```

## 4. Run it

### The easy way: one VS Code task
Press **Ctrl+Shift+B** (Mac: **Cmd+Shift+B**) and choose **Start CampusSafe (emulators + demo data + dashboard)**. It opens three terminals, one after another:
1. Firebase emulators (wait for "All emulators ready")
2. Demo data (sample students, responders, 60+ incidents, alerts)
3. The admin website

Then open **<http://localhost:5173>** and sign in with **admin@campussafe.test / Admin123!**

### Or step by step in three terminals
Use the **+** button in the terminal panel to open more terminals.

```bash
# Terminal 1: backend (leave it running)
npm run emulators

# Terminal 2: once terminal 1 says "All emulators ready"
npm run seed:demo        # or: npm run seed   (accounts and categories only, no sample incidents)

# Terminal 3: admin website (leave it running)
npm run web
```

| Address | What |
|---|---|
| <http://localhost:5173> | Admin website |
| <http://127.0.0.1:4000> | Emulator UI: see the database, users and function logs |

Test accounts: admin **admin@campussafe.test / Admin123!** (website), responder **responder@campussafe.test / Respond123!** and student **student@campussafe.test / Student123!** (mobile app). Demo users use the password **Demo1234!**.

### Mobile app (Flutter)
With the emulators running, start an Android emulator (or connect a phone), open the **Run and Debug** panel (Ctrl+Shift+D), choose **Mobile app (local emulators)** and press ▶. On a real phone on the same Wi-Fi, add `--dart-define=EMULATOR_HOST=<your computer's IP>` to the args in `.vscode/launch.json`.

## 5. Stopping and saving data
Click in the emulator terminal and press **Ctrl+C once**, then wait. The data is saved to the `emulator-data` folder and loaded again the next time you run `npm run emulators`. To start over with an empty database, delete the `emulator-data` folder.

## 6. Tests
```bash
npm run test:rules        # Security Rules
npm run test:functions    # Cloud Functions
```

## Common problems

| Problem | Fix |
|---|---|
| `Could not spawn java` / Java errors | Install Java 21 and reopen VS Code |
| `Port 8080 is not open` / port already in use | Another program (or an old emulator) uses the port. Close it, or restart the computer |
| Website shows "Connecting…" forever | The emulators are not running; start terminal 1 first |
| `firebase: command not found` | `npm install -g firebase-tools`, then reopen the terminal |
| Login fails with the test accounts | Run `npm run seed` (or `npm run seed:demo`) while the emulators are running |
