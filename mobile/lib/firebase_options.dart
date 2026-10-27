// PLACEHOLDER Firebase options for local development with the emulators.
//
// When your real Firebase project is ready, run this from the mobile/ folder
// to overwrite this file with your project's settings:
//
//   flutterfire configure --project=<your-firebase-project-id>
//
// These demo values only work together with the Firebase Emulator Suite
// (run the app with --dart-define=USE_EMULATOR=true).
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return ios;
      default:
        return android;
    }
  }

  static const _projectId = 'demo-campussafe';

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'demo-api-key',
    appId: '1:000000000000:android:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: _projectId,
    storageBucket: '$_projectId.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'demo-api-key',
    appId: '1:000000000000:ios:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: _projectId,
    storageBucket: '$_projectId.firebasestorage.app',
    iosBundleId: 'edu.mseuf.campussafe',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'demo-api-key',
    appId: '1:000000000000:web:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: _projectId,
    authDomain: '$_projectId.firebaseapp.com',
    storageBucket: '$_projectId.firebasestorage.app',
  );
}
