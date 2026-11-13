import 'package:material_ui/material_ui.dart';

import '../core/api_client.dart';
import '../core/models.dart';
import 'common.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.api});
  final ApiClient api;
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<FinanceSummary> _future;
  int _period = 0;
  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final now = DateTime.now();
    final start = _period == 0
        ? DateTime(now.year, now.month)
        : DateTime(
            now.year,
            now.month,
            now.day,
          ).subtract(Duration(days: _period - 1));
    _future = widget.api.finance(from: start, to: now);
  }

  Future<void> _refresh() async {
    setState(_load);
    await _future;
  }

  @override
  Widget build(BuildContext context) => AsyncContent<FinanceSummary>(
    future: _future,
    retry: () => setState(_load),
    builder: (summary) => RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Um olhar sobre seu negócio',
            style: Theme.of(context).textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text('Resumo do caixa e das vendas até agora.'),
          const SizedBox(height: 20),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, label: Text('Este mês')),
              ButtonSegment(value: 30, label: Text('30 dias')),
              ButtonSegment(value: 90, label: Text('90 dias')),
            ],
            selected: {_period},
            onSelectionChanged: (values) => setState(() {
              _period = values.first;
              _load();
            }),
          ),
          const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) => Wrap(
              spacing: 12,
              runSpacing: 12,
              children:
                  [
                        (
                          'Recebido',
                          summary.value('receivedTotal'),
                          Icons.payments_outlined,
                        ),
                        (
                          'A receber',
                          summary.value('receivableTotal'),
                          Icons.schedule_outlined,
                        ),
                        (
                          'Saldo em caixa',
                          summary.value('netCash'),
                          Icons.account_balance_wallet_outlined,
                        ),
                        (
                          'Despesas',
                          summary.value('expensesTotal'),
                          Icons.receipt_long_outlined,
                        ),
                        (
                          'Vendas',
                          summary.value('salesTotal'),
                          Icons.shopping_bag_outlined,
                        ),
                        (
                          'Lucro estimado',
                          summary.value('estimatedProfit'),
                          Icons.trending_up_outlined,
                        ),
                      ]
                      .map(
                        (metric) => SizedBox(
                          width: constraints.maxWidth < 330
                              ? constraints.maxWidth
                              : (constraints.maxWidth - 12) / 2,
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    metric.$3,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .primary,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(metric.$1),
                                  const SizedBox(height: 8),
                                  Text(
                                    money(metric.$2),
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      )
                      .toList(),
            ),
          ),
          const SizedBox(height: 20),
          Text('${summary.ordersCount} pedidos criados no período'),
          const SizedBox(height: 8),
          const Text(
            'Recebimentos seguem a data do pagamento. O saldo em caixa considera o saldo inicial cadastrado no sistema web.',
          ),
        ],
      ),
    ),
  );
}
