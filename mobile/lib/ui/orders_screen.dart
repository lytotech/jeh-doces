import 'package:material_ui/material_ui.dart';

import '../core/api_client.dart';
import '../core/models.dart';
import 'common.dart';
import 'order_detail_screen.dart';
import 'order_form_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key, required this.api});
  final ApiClient api;
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late Future<List<Order>> _future;
  String _search = '';
  String? _status;
  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = widget.api.orders();
  }

  Future<void> _open([Order? order]) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => order == null
            ? OrderFormScreen(api: widget.api)
            : OrderDetailScreen(api: widget.api, order: order),
      ),
    );
    if (mounted) setState(_load);
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Buscar pedido ou cliente',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (value) => setState(() => _search = value),
              ),
            ),
            const SizedBox(width: 12),
            IconButton.filled(
              tooltip: 'Novo pedido',
              onPressed: () => _open(),
              icon: const Icon(Icons.add),
            ),
          ],
        ),
      ),
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: const Text('Todos'),
                selected: _status == null,
                onSelected: (_) => setState(() => _status = null),
              ),
            ),
            ...orderStatuses.entries.map(
              (status) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(status.value),
                  selected: _status == status.key,
                  onSelected: (_) => setState(() => _status = status.key),
                ),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 8),
      Expanded(
        child: AsyncContent<List<Order>>(
          future: _future,
          retry: () => setState(_load),
          builder: (orders) {
            final filtered = orders
                .where(
                  (order) =>
                      (_status == null || order.status == _status) &&
                      '${order.code} ${order.clientName}'
                          .toLowerCase()
                          .contains(_search.toLowerCase()),
                )
                .toList();
            return RefreshIndicator(
              onRefresh: () async {
                setState(_load);
                await _future;
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(12),
                children: [
                  if (filtered.isEmpty)
                    const EmptyContent(
                      'Nenhum pedido encontrado. Toque em + para criar um orçamento.',
                    ),
                  ...filtered.map(
                    (order) => Card(
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        title: Text(
                          order.clientName,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${order.code} · ${orderStatuses[order.status] ?? order.status}',
                              ),
                              const SizedBox(height: 4),
                              Text(dateTimeLabel(order.deliveryDate)),
                            ],
                          ),
                        ),
                        trailing: Text(
                          money(order.total),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        onTap: () => _open(order),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    ],
  );
}
