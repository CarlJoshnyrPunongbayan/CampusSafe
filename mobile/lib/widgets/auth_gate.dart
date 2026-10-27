import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../models/user_profile.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/admin_notice_screen.dart';
import '../screens/home/responder_home_screen.dart';
import '../screens/home/student_home_screen.dart';
import '../services/auth_service.dart';

/// Shows the login screen when signed out, otherwise the home screen for the user's role.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key, this.auth});

  final AuthService? auth;

  @override
  Widget build(BuildContext context) {
    final service = auth ?? AuthService();
    return StreamBuilder<User?>(
      stream: service.idTokenChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const _Loading();
        final user = snapshot.data;
        if (user == null) return LoginScreen(auth: service);
        return _SignedIn(key: ValueKey(user.uid), user: user, auth: service);
      },
    );
  }
}

class _SignedIn extends StatefulWidget {
  const _SignedIn({super.key, required this.user, required this.auth});

  final User user;
  final AuthService auth;

  @override
  State<_SignedIn> createState() => _SignedInState();
}

class _SignedInState extends State<_SignedIn> {
  UserRole? _role;
  UserProfile? _profile;
  DateTime? _lastRoleUpdate;
  StreamSubscription<UserProfile?>? _profileSub;

  @override
  void initState() {
    super.initState();
    _loadRole();
    _profileSub = widget.auth.profile(widget.user.uid).listen(_onProfile);
  }

  @override
  void didUpdateWidget(covariant _SignedIn oldWidget) {
    super.didUpdateWidget(oldWidget);
    // A refreshed token may carry a new role claim.
    if (oldWidget.user != widget.user) _loadRole();
  }

  Future<void> _loadRole() async {
    final role = await widget.auth.roleOf(widget.user);
    if (mounted) setState(() => _role = role);
  }

  void _onProfile(UserProfile? profile) {
    // When an admin changes this user's role, refresh the token to pick up the new claim.
    final updated = profile?.roleUpdatedAt;
    if (_lastRoleUpdate != null && updated != null && updated != _lastRoleUpdate) {
      widget.auth.refreshToken().then((_) => _loadRole());
    }
    _lastRoleUpdate = updated ?? DateTime.fromMillisecondsSinceEpoch(0);
    if (mounted) setState(() => _profile = profile);
  }

  @override
  void dispose() {
    _profileSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = _role;
    if (role == null) return const _Loading();
    return switch (role) {
      UserRole.student => StudentHomeScreen(profile: _profile, auth: widget.auth),
      UserRole.responder => ResponderHomeScreen(profile: _profile, auth: widget.auth),
      UserRole.admin => AdminNoticeScreen(auth: widget.auth),
    };
  }
}

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: CircularProgressIndicator()));
}
