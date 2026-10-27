import 'package:campussafe/utils/validators.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Validators.mobileNo', () {
    test('accepts Philippine mobile formats', () {
      expect(Validators.mobileNo('09171234567'), isNull);
      expect(Validators.mobileNo('+639171234567'), isNull);
      expect(Validators.mobileNo('0917 123 4567'), isNull);
    });

    test('rejects other formats', () {
      expect(Validators.mobileNo(''), isNotNull);
      expect(Validators.mobileNo('12345'), isNotNull);
      expect(Validators.mobileNo('0817123456'), isNotNull);
    });

    test('normalizes to 09XXXXXXXXX', () {
      expect(Validators.normalizeMobile('+639171234567'), '09171234567');
      expect(Validators.normalizeMobile('0917-123-4567'), '09171234567');
    });
  });

  test('Validators.email', () {
    expect(Validators.email('juan@mseuf.edu.ph'), isNull);
    expect(Validators.email('juan@'), isNotNull);
    expect(Validators.email(''), isNotNull);
  });

  test('Validators.password requires 8+ characters', () {
    expect(Validators.password('short'), isNotNull);
    expect(Validators.password('longenough'), isNull);
  });

  test('Validators.studentId', () {
    expect(Validators.studentId('2023-00001'), isNull);
    expect(Validators.studentId('a b'), isNotNull);
  });
}
