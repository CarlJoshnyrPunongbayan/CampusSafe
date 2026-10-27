import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'firebase_options.dart';
import 'theme.dart';
import 'widgets/auth_gate.dart';

// flutter run --dart-define=USE_EMULATOR=true
// On a physical phone, also pass --dart-define=EMULATOR_HOST=<your computer's LAN IP>.
const useEmulator = bool.fromEnvironment('USE_EMULATOR');
const emulatorHostOverride = String.fromEnvironment('EMULATOR_HOST');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  if (useEmulator) await _connectToEmulators();
  runApp(const CampusSafeApp());
}

Future<void> _connectToEmulators() async {
  // The Android emulator reaches the host computer through 10.0.2.2.
  final host = emulatorHostOverride.isNotEmpty
      ? emulatorHostOverride
      : (!kIsWeb && defaultTargetPlatform == TargetPlatform.android ? '10.0.2.2' : '127.0.0.1');
  await FirebaseAuth.instance.useAuthEmulator(host, 9099);
  FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
}

class CampusSafeApp extends StatelessWidget {
  const CampusSafeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CampusSafe',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      home: const AuthGate(),
    );
  }
}
