import 'dart:convert';
import 'dart:typed_data';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:confeiti_mobile/core/api_client.dart';
import 'package:confeiti_mobile/core/models.dart';

class FakeAdapter implements HttpClientAdapter {
  FakeAdapter(this.handle);
  final ResponseBody Function(RequestOptions request) handle;
  final requests = <RequestOptions>[];
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return handle(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody reply(
  Object body, {
  int status = 200,
  Map<String, List<String>> headers = const {},
}) => ResponseBody.fromString(
  jsonEncode(body),
  status,
  headers: {
    Headers.contentTypeHeader: ['application/json'],
    ...headers,
  },
);

ApiClient clientFor(FakeAdapter adapter, {CookieJar? cookies}) {
  final dio = Dio()..httpClientAdapter = adapter;
  return ApiClient(
    baseUrl: Uri.parse('https://confeiti.test/api/'),
    cookies: cookies ?? CookieJar(),
    dio: dio,
  );
}

final sessionJson = <String, dynamic>{
  'user': {'id': 'user', 'name': 'Jéssica', 'email': 'jeh@example.com'},
  'activeCompanyId': 'company',
  'companyInactive': false,
  'role': 'owner',
  'companies': [
    {
      'id': 'company',
      'name': 'Doces da Jeh',
      'role': 'owner',
      'inactive': false,
    },
    {'id': 'other', 'name': 'Outra loja', 'role': 'owner', 'inactive': false},
  ],
};

final orderJson = <String, dynamic>{
  'id': 'order',
  'orderNumber': '#K7M4P9',
  'clientName': 'Camila',
  'status': 'entregue',
  'totalCharged': 100,
  'deliveryDate': '2026-11-10T12:00:00Z',
  'payments': <Json>[],
  'items': [
    {'productName': 'Bolo', 'quantity': 1, 'unitPrice': 100, 'totalPrice': 100},
  ],
};

class MemoryStorage implements Storage {
  final values = <String, String>{};
  @override
  Future<void> init(bool persistSession, bool ignoreExpires) async {}
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }

  @override
  Future<void> delete(String key) async {
    values.remove(key);
  }

  @override
  Future<void> deleteAll(List<String> keys) async {
    values.clear();
  }
}
