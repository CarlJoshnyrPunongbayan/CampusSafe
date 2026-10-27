# Setting Up the Real Firebase Project

You only need this when you are ready to move off the emulators, for example for testing on real phones over mobile data, the pilot, or deployment. Everything before that runs locally (see the README).

## 1. Create the project
1. Go to <https://console.firebase.google.com> → **Add project** → name it, e.g. `campussafe-mseuf`. Note the **project ID**.
2. Google Analytics is optional.
3. **Upgrade to the Blaze (pay-as-you-go) plan**: ⚙ → *Usage and billing* → *Details & settings*. Cloud Functions require it. Then set a **budget alert** (for example ₱300) in Google Cloud Billing. A capstone-sized project normally stays within the free usage tiers.

## 2. Turn on the services
| Console page | Action |
|---|---|
| Build → Authentication | Get started → enable **Email/Password** |
| Build → Firestore Database | Create database → **production mode** → location `asia-southeast1` (Singapore) |
| Build → Storage | Get started → same location |
| Build → Functions | Get started (needs Blaze) |
| Build → Hosting | Get started |
| Cloud Messaging | Nothing to do now (set up in sprint 3) |

## 3. Point the repo at your project
```bash
firebase login
firebase use --add            # pick your project, alias "prod"
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

## 4. Create the first admin and reference data
1. Console → ⚙ Project settings → **Service accounts** → *Generate new private key*. Save it **outside the repo** and never commit it.
2. Run:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
ADMIN_EMAIL=security@yourdomain ADMIN_PASSWORD='a-strong-password' ADMIN_MOBILE=09XXXXXXXXX \
node scripts/seed.js --project <your-project-id> --production
```
3. In the Firestore console, edit `config/app.securityHotline` to the real security office number, and replace the sample `locationTags` with real campus locations.

## 5. Web dashboard config
1. Console → ⚙ Project settings → *Your apps* → **Add app → Web** (`</>`) → register it as "CampusSafe Dashboard".
2. Copy `web/.env.example` to `web/.env.local` and fill in the values shown in the console. Set `VITE_USE_EMULATORS=false`.
3. Deploy: `npm --prefix web run build && firebase deploy --only hosting`.

## 6. Mobile app config
```bash
dart pub global activate flutterfire_cli
cd mobile
flutterfire configure --project=<your-project-id> --platforms=android,ios
```
This overwrites `mobile/lib/firebase_options.dart` and adds `google-services.json` / `GoogleService-Info.plist`. Then run **without** the emulator flag: `flutter run`.

## 7. Google Maps API keys (needed from sprint 2)
In <https://console.cloud.google.com> (same project) → *APIs & Services*:
1. Enable **Maps SDK for Android**, **Maps SDK for iOS** and **Maps JavaScript API**.
2. *Credentials → Create credentials → API key*. Create three keys and **restrict** each one:
   - Android: restrict to Android apps, package `edu.mseuf.campussafe` plus your SHA-1 (`cd mobile/android && ./gradlew signingReport`)
   - iOS: restrict to iOS apps, bundle ID `edu.mseuf.campussafe`
   - Web: restrict to HTTP referrers: your Hosting domain and `localhost`
3. Keep the keys for now; sprint 2 shows where each one goes.
