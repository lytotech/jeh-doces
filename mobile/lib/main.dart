import 'dart:convert';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:material_ui/material_ui.dart';

import 'core/api_client.dart';
import 'core/app_state.dart';
import 'core/config.dart';
import 'core/secure_cookie_storage.dart';
import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final baseUrl = AppConfig.parseApiUrl(AppConfig.apiUrl);
    final cookies = PersistCookieJar(
      persistSession: true,
      ignoreExpires: false,
      storage: SecureCookieStorage(
        namespace: base64Url.encode(utf8.encode(baseUrl.toString())),
      ),
    );
    final state = AppState(ApiClient(baseUrl: baseUrl, cookies: cookies));
    runApp(ConfeitiApp(state: state));
    state.restore();
  } on FormatException catch (error) {
    runApp(
      MaterialApp(
        home: Scaffold(
          body: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(error.message, textAlign: TextAlign.center),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
