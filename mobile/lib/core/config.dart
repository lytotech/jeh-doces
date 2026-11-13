import 'package:flutter/foundation.dart';

class AppConfig {
  static const apiUrl = String.fromEnvironment('API_URL');

  static Uri parseApiUrl(String value, {bool release = kReleaseMode}) {
    final uri = Uri.tryParse(value.trim());
    if (uri == null ||
        !uri.hasAuthority ||
        uri.host.isEmpty ||
        uri.userInfo.isNotEmpty ||
        uri.hasQuery ||
        uri.hasFragment ||
        !['https', 'http'].contains(uri.scheme)) {
      throw const FormatException(
        'Configure API_URL com a URL completa da API, terminando em /api.',
      );
    }
    if (release && uri.scheme != 'https') {
      throw const FormatException(
        'A versão de produção exige uma API com HTTPS.',
      );
    }
    final path = uri.path.replaceFirst(RegExp(r'/+$'), '');
    return uri.replace(path: '$path/');
  }
}
