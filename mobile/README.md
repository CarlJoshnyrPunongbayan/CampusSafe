# CampusSafe Mobile App (Flutter)

The app for students and responders. See the [root README](../README.md) for full setup.

```bash
flutter pub get
flutter run --dart-define=USE_EMULATOR=true   # against the local Firebase emulators
flutter test
flutter analyze
```

Structure:

```
lib/
├── main.dart              Firebase init and emulator connection
├── firebase_options.dart  Placeholder; replace by running `flutterfire configure`
├── theme.dart
├── models/                Firestore document models
├── services/              Firebase access (auth_service.dart)
├── screens/auth/          Login, Register
├── screens/home/          Student, Responder and Admin home screens
├── utils/validators.dart  Form validation
└── widgets/auth_gate.dart Routes by sign-in state and role
```
