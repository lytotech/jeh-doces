import 'package:flutter/foundation.dart';

import 'api_client.dart';
import 'models.dart';

class AppState extends ChangeNotifier {
  AppState(this.api) {
    api.onUnauthorized = _expire;
  }
  final ApiClient api;
  Session? session;
  bool loading = true;
  String? startupError;
  int revision = 0;

  Future<void> restore() async {
    loading = true;
    startupError = null;
    notifyListeners();
    try {
      session = await api.me();
    } on ApiException catch (error) {
      if (error.status != 401) startupError = error.message;
    } catch (_) {
      startupError = 'Não foi possível restaurar sua sessão. Tente novamente.';
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    session = await api.login(email, password);
    startupError = null;
    revision++;
    notifyListeners();
  }

  Future<void> switchCompany(String id) async {
    // Stop showing the previous company's data while the session changes.
    loading = true;
    notifyListeners();
    try {
      session = await api.switchCompany(id);
      revision++;
    } catch (_) {
      await restore();
      rethrow;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      await api.logout();
    } finally {
      session = null;
      revision++;
      notifyListeners();
    }
  }

  void _expire() {
    session = null;
    revision++;
    notifyListeners();
  }

  @override
  void dispose() {
    api.onUnauthorized = null;
    api.close();
    super.dispose();
  }
}
