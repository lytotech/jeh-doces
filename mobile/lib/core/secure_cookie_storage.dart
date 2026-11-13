import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// PersistCookieJar owns expiry and domain/path matching. Its serialized data
// lives in Keychain/Android encrypted storage rather than a plaintext file.
class SecureCookieStorage implements Storage {
  SecureCookieStorage({required this.namespace, FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();
  final String namespace;
  final FlutterSecureStorage _storage;
  String _key(String key) => 'confeiti.cookies.$namespace.$key';
  @override
  Future<void> init(bool persistSession, bool ignoreExpires) async {}
  @override
  Future<String?> read(String key) => _storage.read(key: _key(key));
  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: _key(key), value: value);
  @override
  Future<void> delete(String key) => _storage.delete(key: _key(key));
  @override
  Future<void> deleteAll(List<String> keys) async {
    final all = await _storage.readAll();
    for (final key
        in all.keys.where((key) => key.startsWith(_key(''))).toList()) {
      await _storage.delete(key: key);
    }
  }
}
