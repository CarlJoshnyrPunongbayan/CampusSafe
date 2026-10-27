import 'package:campussafe/screens/auth/login_screen.dart';
import 'package:campussafe/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuth extends AuthService {
  String? email;
  String? password;

  @override
  Future<void> signIn({required String email, required String password}) async {
    this.email = email;
    this.password = password;
  }
}

void main() {
  testWidgets('shows validation errors and does not sign in with empty fields', (tester) async {
    final auth = _FakeAuth();
    await tester.pumpWidget(MaterialApp(home: LoginScreen(auth: auth)));

    await tester.tap(find.byKey(const Key('login-submit')));
    await tester.pump();

    expect(find.text('Email is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
    expect(auth.email, isNull);
  });

  testWidgets('signs in with valid input', (tester) async {
    final auth = _FakeAuth();
    await tester.pumpWidget(MaterialApp(home: LoginScreen(auth: auth)));

    await tester.enterText(find.byKey(const Key('login-email')), 'student@campussafe.test');
    await tester.enterText(find.byKey(const Key('login-password')), 'Student123!');
    await tester.tap(find.byKey(const Key('login-submit')));
    await tester.pump();

    expect(auth.email, 'student@campussafe.test');
    expect(auth.password, 'Student123!');
  });
}
