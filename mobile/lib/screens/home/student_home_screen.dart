import 'package:flutter/material.dart';

import '../../models/user_profile.dart';
import '../../services/auth_service.dart';

class StudentHomeScreen extends StatelessWidget {
  const StudentHomeScreen({super.key, required this.profile, required this.auth});

  final UserProfile? profile;
  final AuthService auth;

  void _comingSoon(BuildContext context, String feature, String sprint) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text('$feature will be available in $sprint.')));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final firstName = (profile?.name ?? '').split(' ').first;
    return Scaffold(
      appBar: AppBar(
        title: const Text('CampusSafe'),
        actions: [
          IconButton(tooltip: 'Sign out', icon: const Icon(Icons.logout), onPressed: auth.signOut),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(firstName.isEmpty ? 'Hello!' : 'Hello, $firstName!', style: theme.textTheme.headlineSmall),
            Text('Stay safe on campus.', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 32),
            Center(
              child: SizedBox.square(
                dimension: 200,
                child: FilledButton(
                  key: const Key('sos-button'),
                  style: FilledButton.styleFrom(shape: const CircleBorder(), elevation: 6),
                  onPressed: () => _comingSoon(context, 'SOS', 'sprint 4'),
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.sos, size: 64),
                      Text('Tap for help', style: TextStyle(fontSize: 16)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _ActionTile(icon: Icons.report_outlined, label: 'Report Incident', onTap: () => _comingSoon(context, 'Incident reporting', 'sprint 2')),
                _ActionTile(icon: Icons.list_alt, label: 'My Reports', onTap: () => _comingSoon(context, 'My Reports', 'sprint 2')),
                _ActionTile(icon: Icons.campaign_outlined, label: 'Alerts', onTap: () => _comingSoon(context, 'Alerts', 'sprint 4')),
                _ActionTile(icon: Icons.call_outlined, label: 'Call Security', onTap: () => _comingSoon(context, 'Call Security', 'sprint 4')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: scheme.primary),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
