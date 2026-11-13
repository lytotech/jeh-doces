import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:confeiti_mobile/app.dart';
import 'package:confeiti_mobile/core/api_client.dart';
import 'package:confeiti_mobile/core/app_state.dart';
import 'package:confeiti_mobile/core/models.dart';

import 'support/fake_api.dart';

void main() {
  testWidgets(
    'login abre financeiro e sessão expirada remove o detalhe do pedido',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      var expired = false;
      final adapter = FakeAdapter((request) {
        if (expired) return reply({'error': 'Sessão expirada'}, status: 401);
        return switch (request.path) {
          'auth/login' => reply({'success': true}),
          'auth/me' => reply(sessionJson),
          'orders' => reply([orderJson]),
          'finance/summary' => reply({
            'receivedTotal': 410.50,
            'ordersCount': 1,
          }),
          _ => reply({'error': 'Endpoint inesperado'}, status: 404),
        };
      });
      final state = AppState(clientFor(adapter))..loading = false;
      await tester.pumpWidget(ConfeitiApp(state: state));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byType(TextFormField).at(0),
        'jeh@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(1), 'password');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();
      expect(find.text('Recebido'), findsOneWidget);
      expect(find.textContaining('410,50'), findsOneWidget);
      await tester.tap(find.text('Pedidos'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Camila'));
      await tester.pumpAndSettle();
      expect(find.text('Pedido #K7M4P9'), findsOneWidget);
      expired = true;
      await tester.runAsync(() async {
        await expectLater(state.api.orders(), throwsA(isA<ApiException>()));
      });
      await tester.pumpAndSettle();
      expect(find.text('Entrar'), findsOneWidget);
      expect(find.text('Pedido #K7M4P9'), findsNothing);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      state.dispose();
    },
  );

  testWidgets('cria orçamento com cliente, produto e material automático', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    Json? submitted;
    final adapter = FakeAdapter((request) {
      if (request.path == 'orders' && request.method == 'POST') {
        submitted = request.data as Json;
        return reply(orderJson);
      }
      return switch (request.path) {
        'orders' => reply([]),
        'finance/summary' => reply({'ordersCount': 0}),
        'customers' => reply([
          {'id': 'customer', 'name': 'Camila'},
        ]),
        'products' => reply([
          {
            'id': 'cake',
            'name': 'Bolo',
            'salePrice': 100,
            'calculatedCost': 40,
            'materials': [
              {'materialId': 'box', 'quantity': 1},
            ],
          },
        ]),
        'materials' => reply([
          {'id': 'box', 'name': 'Caixa', 'unitCost': 5},
        ]),
        _ => reply({'error': 'Endpoint inesperado'}, status: 404),
      };
    });
    final state = AppState(clientFor(adapter))
      ..loading = false
      ..session = Session.fromJson(sessionJson);
    await tester.pumpWidget(ConfeitiApp(state: state));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Pedidos'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Novo pedido'));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(DropdownButtonFormField<Customer>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Camila').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Aumentar quantidade de Bolo'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Criar orçamento'));
    await tester.tap(find.text('Criar orçamento'));
    await tester.pumpAndSettle();
    expect(submitted?['customerId'], 'customer');
    expect(submitted?['totalCharged'], 100);
    expect(submitted?['estimatedCost'], 40);
    expect(submitted?['status'], 'orcamento');
    expect((submitted?['materials'] as List).single['isAutomatic'], isTrue);
    expect(submitted!.containsKey('orderNumber'), isFalse);
    expect(find.text('Novo orçamento'), findsNothing);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox.shrink());
    state.dispose();
  });
}
