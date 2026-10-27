/// Form validators. Each returns an error message, or null when the value is valid.
class Validators {
  static final _email = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
  // Philippine mobile numbers: 09XXXXXXXXX or +639XXXXXXXXX.
  static final _phMobile = RegExp(r'^(09|\+639)\d{9}$');
  static final _studentId = RegExp(r'^[A-Za-z0-9-]{4,20}$');

  static String? required(String? value, String field) =>
      (value == null || value.trim().isEmpty) ? '$field is required' : null;

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required';
    return _email.hasMatch(value.trim()) ? null : 'Enter a valid email address';
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    return value.length < 8 ? 'Password must be at least 8 characters' : null;
  }

  static String? mobileNo(String? value) {
    if (value == null || value.trim().isEmpty) return 'Mobile number is required';
    final cleaned = value.replaceAll(RegExp(r'[\s-]'), '');
    return _phMobile.hasMatch(cleaned) ? null : 'Use the format 09XXXXXXXXX';
  }

  static String? studentId(String? value) {
    if (value == null || value.trim().isEmpty) return 'Student ID is required';
    return _studentId.hasMatch(value.trim()) ? null : 'Enter a valid student ID';
  }

  /// Normalizes a valid mobile number to 09XXXXXXXXX.
  static String normalizeMobile(String value) {
    final cleaned = value.replaceAll(RegExp(r'[\s-]'), '');
    return cleaned.startsWith('+63') ? '0${cleaned.substring(3)}' : cleaned;
  }
}
