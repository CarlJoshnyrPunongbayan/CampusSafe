import 'package:flutter/material.dart';

import '../../models/user_profile.dart';
import '../../services/auth_service.dart';

class ResponderHomeScreen extends StatelessWidget {
  const ResponderHomeScreen({super.key, required this.profile, required this.auth});

  final UserProfile? profile;
  final AuthService auth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Responder'),
        actions: [
          IconButton(tooltip: 'Sign out', icon: const Icon(Icons.logout), onPressed: auth.signOut),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(profile?.name ?? 'Responder', style: theme.textTheme.headlineSmall),
            Text('Assigned incidents', style: theme.textTheme.titleMedium),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Incidents assigned to you by the security office will appear here (sprint 5).',
                  style: theme.textTheme.bodyMedium,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
