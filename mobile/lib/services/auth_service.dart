import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../models/user_profile.dart';

class AuthService {
  AuthService({FirebaseAuth? auth, FirebaseFirestore? db})
      : _authOverride = auth,
        _dbOverride = db;

  final FirebaseAuth? _authOverride;
  final FirebaseFirestore? _dbOverride;

  FirebaseAuth get _auth => _authOverride ?? FirebaseAuth.instance;
  FirebaseFirestore get _db => _dbOverride ?? FirebaseFirestore.instance;

  /// Emits on sign-in, sign-out and whenever the ID token (and its role claim) refreshes.
  Stream<User?> idTokenChanges() => _auth.idTokenChanges();

  /// The role Security Rules enforce comes from the token's custom claim.
  Future<UserRole> roleOf(User user) async {
    final token = await user.getIdTokenResult();
    return UserRole.parse(token.claims?['role']);
  }

  Stream<UserProfile?> profile(String uid) => _db
      .collection('users')
      .doc(uid)
      .snapshots()
      .map((doc) => doc.exists ? UserProfile.fromDoc(doc) : null);

  Future<void> signIn({required String email, required String password}) =>
      _auth.signInWithEmailAndPassword(email: email.trim(), password: password);

  /// Creates the Auth account and the users/{uid} profile. New accounts are always
  /// students; security staff are promoted by an admin from the web dashboard.
  Future<void> register({
    required String name,
    required String studentId,
    required String email,
    required String mobileNo,
    required String password,
  }) async {
    final credential = await _auth.createUserWithEmailAndPassword(email: email.trim(), password: password);
    final user = credential.user!;
    try {
      await user.updateDisplayName(name.trim());
      await _db.collection('users').doc(user.uid).set({
        'name': name.trim(),
        'studentId': studentId.trim(),
        'email': user.email,
        'mobileNo': mobileNo,
        'role': 'student',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (_) {
      // Do not leave an account without a profile behind.
      await user.delete();
      rethrow;
    }
  }

  Future<void> sendPasswordReset(String email) => _auth.sendPasswordResetEmail(email: email.trim());

  Future<void> refreshToken() async => _auth.currentUser?.getIdToken(true);

  Future<void> signOut() => _auth.signOut();

  static String friendlyError(Object error) {
    if (error is FirebaseAuthException) {
      switch (error.code) {
        case 'invalid-credential':
        case 'wrong-password':
        case 'user-not-found':
          return 'Incorrect email or password.';
        case 'email-already-in-use':
          return 'An account already exists for this email.';
        case 'weak-password':
          return 'Choose a stronger password.';
        case 'invalid-email':
          return 'Enter a valid email address.';
        case 'too-many-requests':
          return 'Too many attempts. Please wait and try again.';
        case 'network-request-failed':
          return 'No internet connection.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
