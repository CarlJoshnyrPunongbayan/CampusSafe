# CampusSafe

Incident Reporting and Assistance, and Emergency Alert Mobile App: BSIT Capstone Project, College of Computing and Multimedia Studies, Manuel S. Enverga University Foundation.

| Part | Folder | Tech | Users |
|---|---|---|---|
| Mobile app | [`mobile/`](mobile) | Flutter | Students and responders |
| Web dashboard | [`web/`](web) | React.js + Tailwind CSS (Vite) | Security office (admin) |
| Backend | [`functions/`](functions), [`firestore.rules`](firestore.rules), [`storage.rules`](storage.rules) | Firebase: Authentication, Cloud Firestore, Cloud Functions, Cloud Storage, Cloud Messaging, Hosting | Both |

## Build progress

| Sprint | Scope | Status |
|---|---|---|
| 1 | Project setup, data model, security rules, roles, login in both apps | ✅ Done |
| — | **Admin web dashboard + backend** (all admin pages, priority tagging, escalation, notifications, analytics). See [docs/admin-dashboard.md](docs/admin-dashboard.md) | ✅ Done |
| 2 | Mobile: incident reporting (GPS + photos), My Reports | ⏳ Next |
| 4 | Mobile: SOS, call security, chat, alerts inbox, push notifications | |
| 5 | Mobile: QR scanning, offline report queue, responder mode | |
| 7 | Testing (Table XII), deployment, pilot | |

## Prerequisites

- [Node.js 22](https://nodejs.org/)
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (stable channel), plus Android Studio for Android or Xcode for iOS (macOS only)
- Java 21 or later (required by the Firebase Emulator Suite)
- Firebase CLI: `npm install -g firebase-tools`

## Run everything locally (no Firebase project needed)

All development runs on the **Firebase Emulator Suite**, so it costs nothing and does not touch real data.

```bash
# 1. Install dependencies (once)
npm install
npm --prefix functions install
npm --prefix web install
(cd mobile && flutter pub get)

# 2. Terminal 1: start the emulators (Auth, Firestore, Functions, Storage). Emulator UI at http://127.0.0.1:4000
npm run emulators

# 3. Terminal 2: load sample incident types, location tags and test accounts
npm run seed              # add  -- --demo  for sample incidents, users and alerts (for presentations)

# 4. Terminal 3: web dashboard at http://localhost:5173
npm --prefix web run dev

# 5. Terminal 4: mobile app on an Android emulator or a connected device
cd mobile
flutter run --dart-define=USE_EMULATOR=true
# On a physical phone on the same Wi-Fi, also add --dart-define=EMULATOR_HOST=<your computer's LAN IP>
```

### Test accounts (emulator only)

| Role | Email | Password | Use in |
|---|---|---|---|
| Admin (security office) | admin@campussafe.test | Admin123! | Web dashboard |
| Responder | responder@campussafe.test | Respond123! | Mobile app |
| Student | student@campussafe.test | Student123! | Mobile app |

New accounts registered from the mobile app are always **students**. An admin promotes users to responder or admin on the dashboard's **Users** page.

## Tests

```bash
npm run test:rules        # Firestore + Storage Security Rules (emulator)
npm run test:functions    # Cloud Functions (emulator)
(cd mobile && flutter test && flutter analyze)
npm --prefix web run build && npm --prefix web run lint
```

## Connecting a real Firebase project

See [docs/firebase-setup.md](docs/firebase-setup.md) for the console steps: creating the project, the Blaze plan, Google Maps keys, `flutterfire configure`, and the web `.env.local`.

## Documentation

- [docs/admin-dashboard.md](docs/admin-dashboard.md): dashboard pages, Cloud Functions and evaluation measurements, mapped to the panel's requirements
- [docs/mobile-integration.md](docs/mobile-integration.md): what the Flutter user app must read and write to work with the backend
- [docs/data-model.md](docs/data-model.md): Firestore collections, roles and who can access what
- [docs/firebase-setup.md](docs/firebase-setup.md): setting up the real Firebase project
