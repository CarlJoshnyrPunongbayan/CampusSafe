import 'package:flutter/material.dart';

class BrandHeader extends StatelessWidget {
  const BrandHeader({super.key, required this.subtitle});

  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Icon(Icons.shield, size: 64, color: theme.colorScheme.primary),
        const SizedBox(height: 8),
        Text('CampusSafe', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
        Text(subtitle, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      ],
    );
  }
}
