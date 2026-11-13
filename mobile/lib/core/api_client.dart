import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';

import 'models.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.status});
  final String message;
  final int? status;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({required Uri baseUrl, required CookieJar cookies, Dio? dio})
    : _cookies = cookies,
      _dio = dio ?? Dio() {
    _dio.options = BaseOptions(
      baseUrl: baseUrl.toString(),
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 25),
      sendTimeout: const Duration(seconds: 25),
      headers: {'Accept': 'application/json'},
      followRedirects: false,
    );
    _dio.interceptors.add(CookieManager(cookies));
  }
  final Dio _dio;
  final CookieJar _cookies;
  void Function()? onUnauthorized;

  Future<dynamic> request(
    String path, {
    String method = 'GET',
    Object? data,
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        path,
        data: data,
        queryParameters: query,
        options: Options(method: method),
      );
      return response.data;
    } on DioException catch (error) {
      final status = error.response?.statusCode;
      if (status == 401 && path != 'auth/login') onUnauthorized?.call();
      final body = error.response?.data;
      final message = body is Map ? body['error'] ?? body['message'] : null;
      throw ApiException(
        message is String
            ? message
            : status == null
            ? 'Não foi possível conectar. Verifique sua internet e tente novamente.'
            : 'Não foi possível concluir a operação. Tente novamente.',
        status: status,
      );
    }
  }

  Future<Session> me() async =>
      Session.fromJson(await request('auth/me') as Json);
  Future<Session> login(String email, String password) async {
    await request(
      'auth/login',
      method: 'POST',
      data: {'email': email.trim(), 'password': password},
    );
    return me();
  }

  Future<void> logout() async {
    try {
      await request('auth/logout', method: 'POST');
    } finally {
      await _cookies.deleteAll();
    }
  }

  Future<Session> switchCompany(String companyId) async {
    await request(
      'auth/switch-company',
      method: 'POST',
      data: {'companyId': companyId},
    );
    return me();
  }

  Future<List<Order>> orders() async => (await request('orders') as List)
      .map((value) => Order.fromJson(value as Json))
      .toList();
  Future<Order> createOrder(Json data) async => Order.fromJson(
    await request('orders', method: 'POST', data: data) as Json,
  );
  Future<Order> changeStatus(String id, String status) async => Order.fromJson(
    await request(
      'orders/${Uri.encodeComponent(id)}/status',
      method: 'PATCH',
      data: {'status': status},
    ) as Json,
  );
  Future<Order> addPayment(
    String id, {
    required double amount,
    required String method,
    required DateTime paidAt,
  }) async => Order.fromJson(
    await request(
      'orders/${Uri.encodeComponent(id)}/payments',
      method: 'POST',
      data: {
        'amount': amount,
        'method': method,
        'paidAt': paidAt.toUtc().toIso8601String(),
      },
    ) as Json,
  );
  Future<List<Customer>> customers() async =>
      (await request('customers') as List)
          .map((value) => Customer.fromJson(value as Json))
          .toList();
  Future<Customer> saveCustomer(Json data, {String? id}) async =>
      Customer.fromJson(
        await request(
          id == null ? 'customers' : 'customers/${Uri.encodeComponent(id)}',
          method: id == null ? 'POST' : 'PUT',
          data: data,
        ) as Json,
      );
  Future<List<Product>> products() async => (await request('products') as List)
      .map((value) => Product.fromJson(value as Json))
      .toList();
  Future<List<Json>> materials() async =>
      (await request('materials') as List).cast<Json>();
  Future<FinanceSummary> finance({
    required DateTime from,
    required DateTime to,
  }) async => FinanceSummary.fromJson(
    await request(
      'finance/summary',
      query: {
        'from': from.toUtc().toIso8601String(),
        'to': to.toUtc().toIso8601String(),
      },
    ) as Json,
  );
  void close() => _dio.close();
}
