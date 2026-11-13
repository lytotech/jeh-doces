import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:confeiti_mobile/core/api_client.dart';
import 'package:confeiti_mobile/core/app_state.dart';
import 'package:confeiti_mobile/core/config.dart';
import 'package:confeiti_mobile/core/models.dart';
import 'package:confeiti_mobile/core/secure_cookie_storage.dart';

import 'support/fake_api.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('valida URL da API e exige HTTPS em produção', () {
    expect(
      AppConfig.parseApiUrl('https://confeiti.test/api').toString(),
      'https://confeiti.test/api/',
    );
    expect(
      AppConfig.parseApiUrl('http://10.0.2.2:3001/api', release: false).host,
      '10.0.2.2',
    );
    for (final value in [
      '',
      '/api',
      'https://user:secret@confeiti.test/api',
      'https://confeiti.test/api?token=secret',
    ]) {
      expect(() => AppConfig.parseApiUrl(value), throwsFormatException);
    }
    expect(
      () => AppConfig.parseApiUrl('http://confeiti.test/api', release: true),
      throwsFormatException,
    );
  });

  test(
    'gera orçamento com materiais automáticos agregados sem duplicar seu custo',
    () {
      final draft = OrderDraft(
        products: [
          Product.fromJson({
            'id': 'cake',
            'name': 'Bolo',
            'salePrice': 40,
            'calculatedCost': 15,
            'materials': [
              {'materialId': 'box', 'quantity': 1},
            ],
          }),
          Product.fromJson({
            'id': 'sweet',
            'name': 'Doce',
            'salePrice': 10,
            'calculatedCost': 4,
            'materials': [
              {'materialId': 'box', 'quantity': 2},
            ],
          }),
        ],
        quantities: {'cake': 2, 'sweet': 1},
        materials: [
          {'id': 'box', 'name': 'Caixa', 'unitCost': 2},
        ],
      );
      final customer = Customer.fromJson({'id': 'customer', 'name': 'Camila'});
      final json = draft.toJson(
        customer: customer,
        deliveryDate: DateTime.utc(2026, 11, 12, 15),
      );
      expect(json['totalCharged'], 90);
      expect(json['estimatedCost'], 34);
      expect(json['estimatedProfit'], 56);
      expect(json['materials'], [
        {
          'materialId': 'box',
          'materialName': 'Caixa',
          'quantity': 4.0,
          'unitCost': 2.0,
          'totalCost': 8.0,
          'isAutomatic': true,
        },
      ]);
      expect(json.containsKey('orderNumber'), isFalse);
      expect(json['deliveryDate'], '2026-11-12T15:00:00.000Z');
      expect(
        Order.fromJson({
          ...orderJson,
          'payments': [
            {'amount': 30},
          ],
        }).remaining,
        70,
      );
    },
  );

  test(
    'cookie de sessão persiste entre clientes e é limpo no logout',
    () async {
      final storage = MemoryStorage();
      var cookie = '';
      final adapter = FakeAdapter((request) {
        if (request.path == 'auth/login') {
          expect((request.data as Json)['email'], 'jeh@example.com');
          return reply(
            {'success': true},
            headers: {
              'set-cookie': [
                'jeh_session=private-token; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax',
              ],
            },
          );
        }
        cookie = request.headers[HttpHeaders.cookieHeader] as String? ?? '';
        return reply(
          request.path == 'auth/me' ? sessionJson : {'success': true},
        );
      });
      final first = clientFor(
        adapter,
        cookies: PersistCookieJar(storage: storage),
      );
      expect(
        (await first.login(' jeh@example.com ', 'secret')).companyId,
        'company',
      );
      expect(cookie, contains('jeh_session=private-token'));
      first.close();
      final restored = clientFor(
        adapter,
        cookies: PersistCookieJar(storage: storage),
      );
      await restored.me();
      expect(cookie, contains('jeh_session=private-token'));
      await restored.logout();
      expect(storage.values, isEmpty);
      await restored.me();
      expect(cookie, isEmpty);
      restored.close();
    },
  );

  test(
    'armazenamento seguro isola ambientes e apaga apenas os cookies do app',
    () async {
      FlutterSecureStorage.setMockInitialValues({'unrelated': 'keep'});
      final first = SecureCookieStorage(namespace: 'production');
      final other = SecureCookieStorage(namespace: 'development');
      await first.write('cookie', 'secret');
      await other.write('cookie', 'other');
      expect(await first.read('cookie'), 'secret');
      await first.deleteAll([]);
      expect(await first.read('cookie'), isNull);
      expect(await other.read('cookie'), 'other');
      expect(await const FlutterSecureStorage().read(key: 'unrelated'), 'keep');
    },
  );

  test(
    'pagamento posterior à entrega é enviado com sua própria data UTC',
    () async {
      final adapter = FakeAdapter((request) {
        expect(request.path, 'orders/order/payments');
        expect(request.method, 'POST');
        expect(request.data, {
          'amount': 50.0,
          'method': 'pix',
          'paidAt': '2026-11-12T15:30:00.000Z',
        });
        return reply({
          ...orderJson,
          'payments': [
            {'amount': 50},
          ],
        });
      });
      final client = clientFor(adapter);
      final order = await client.addPayment(
        'order',
        amount: 50,
        method: 'pix',
        paidAt: DateTime.parse('2026-11-12T12:30:00-03:00'),
      );
      expect(order.remaining, 50);
      client.close();
    },
  );

  test(
    'expiração encerra sessão e erros de rede permitem tentar novamente',
    () async {
      var status = 200;
      final adapter = FakeAdapter(
        (_) => reply(
          status == 200 ? sessionJson : {'error': 'Sessão expirada'},
          status: status,
        ),
      );
      final state = AppState(clientFor(adapter));
      await state.restore();
      expect(state.session?.companyId, 'company');
      status = 401;
      await expectLater(state.api.orders(), throwsA(isA<ApiException>()));
      expect(state.session, isNull);
      status = 503;
      await state.restore();
      expect(state.startupError, isNotNull);
      status = 200;
      await state.restore();
      expect(state.startupError, isNull);
      expect(state.session?.companyId, 'company');
      state.dispose();
    },
  );
}
