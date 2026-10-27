import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../widgets/brand_header.dart';

/// Admins (security office) manage incidents from the web dashboard.
class AdminNoticeScreen extends StatelessWidget {
  const AdminNoticeScreen({super.key, required this.auth});

  final AuthService auth;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const BrandHeader(subtitle: 'Security office account'),
                const SizedBox(height: 24),
                const Text(
                  'This account is for the security office. Please use the CampusSafe web dashboard to manage incidents.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                OutlinedButton(onPressed: auth.signOut, child: const Text('Sign out')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
