import 'package:cloud_firestore/cloud_firestore.dart';

enum UserRole {
  student,
  responder,
  admin;

  static UserRole parse(Object? value) =>
      UserRole.values.firstWhere((r) => r.name == value, orElse: () => UserRole.student);
}

/// users/{uid} — see docs/data-model.md.
class UserProfile {
  const UserProfile({
    required this.uid,
    required this.name,
    required this.email,
    required this.mobileNo,
    required this.role,
    this.studentId,
    this.roleUpdatedAt,
  });

  final String uid;
  final String name;
  final String email;
  final String mobileNo;
  final UserRole role;
  final String? studentId;
  final DateTime? roleUpdatedAt;

  factory UserProfile.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? const {};
    return UserProfile(
      uid: doc.id,
      name: data['name'] as String? ?? '',
      email: data['email'] as String? ?? '',
      mobileNo: data['mobileNo'] as String? ?? '',
      role: UserRole.parse(data['role']),
      studentId: data['studentId'] as String?,
      roleUpdatedAt: (data['roleUpdatedAt'] as Timestamp?)?.toDate(),
    );
  }
}
