import 'package:material_ui/material_ui.dart';

import '../core/api_client.dart';
import '../core/models.dart';
import 'common.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key, required this.api, required this.order});
  final ApiClient api;
  final Order order;
  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late Order _order = widget.order;
  bool _saving = false;
  Future<void> _status(String? status) async {
    if (status == null || status == _order.status || _saving) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Alterar para ${orderStatuses[status]}?'),
        content: const Text(
          'A mudança também atualiza o estoque conforme as regras do pedido.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Voltar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _saving = true);
    try {
      final order = await widget.api.changeStatus(_order.id, status);
      if (mounted) setState(() => _order = order);
    } catch (error) {
      if (mounted) showError(context, error);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _payment() async {
    final updated = await Navigator.of(context).push<Order>(
      MaterialPageRoute(
        builder: (_) => PaymentScreen(api: widget.api, order: _order),
      ),
    );
    if (updated != null && mounted) setState(() => _order = updated);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('Pedido ${_order.code}')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          _order.clientName,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(dateTimeLabel(_order.deliveryDate)),
        if ((_order.json['clientPhone'] as String? ?? '').isNotEmpty)
          Text(_order.json['clientPhone'] as String),
        const SizedBox(height: 24),
        DropdownButtonFormField<String>(
          key: ValueKey(_order.status),
          initialValue: _order.status,
          decoration: const InputDecoration(labelText: 'Status'),
          items: orderStatuses.entries
              .map(
                (entry) => DropdownMenuItem(
                  value: entry.key,
                  child: Text(entry.value),
                ),
              )
              .toList(),
          onChanged: _saving ? null : _status,
        ),
        if (_saving) const LinearProgressIndicator(),
        const SizedBox(height: 24),
        Text('Itens', style: Theme.of(context).textTheme.titleLarge),
        ..._order.items.map(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(item['productName'] as String),
            subtitle: Text(
              '${item['quantity']} × ${money(amount(item['unitPrice']))}',
            ),
            trailing: Text(money(amount(item['totalPrice']))),
          ),
        ),
        const Divider(),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Total'),
          trailing: Text(money(_order.total)),
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Pago'),
          trailing: Text(money(_order.paid)),
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('A receber'),
          trailing: Text(money(_order.remaining)),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed:
              _saving || _order.status == 'cancelado' || _order.remaining <= 0
              ? null
              : _payment,
          icon: const Icon(Icons.add_card_outlined),
          label: const Text('Registrar pagamento'),
        ),
        const SizedBox(height: 24),
        Text('Pagamentos', style: Theme.of(context).textTheme.titleLarge),
        if (_order.payments.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Text('Nenhum pagamento registrado.'),
          ),
        ..._order.payments.map(
          (payment) => ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(
              paymentMethods[payment['method']] ?? payment['method'] as String,
            ),
            subtitle: Text(
              dateTimeLabel(DateTime.tryParse(payment['paidAt'] as String)),
            ),
            trailing: Text(money(amount(payment['amount']))),
          ),
        ),
        if ((_order.json['notes'] as String? ?? '').isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Observações', style: Theme.of(context).textTheme.titleMedium),
          Text(_order.json['notes'] as String),
        ],
      ],
    ),
  );
}

const paymentMethods = {
  'pix': 'Pix',
  'dinheiro': 'Dinheiro',
  'cartao_credito': 'Cartão de crédito',
  'cartao_debito': 'Cartão de débito',
  'transferencia': 'Transferência',
  'outro': 'Outro',
};

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key, required this.api, required this.order});
  final ApiClient api;
  final Order order;
  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _form = GlobalKey<FormState>();
  late final _amount = TextEditingController(
    text: widget.order.remaining.toStringAsFixed(2).replaceAll('.', ','),
  );
  String _method = 'pix';
  DateTime _paidAt = DateTime.now();
  bool _saving = false;
  double get _value =>
      double.tryParse(_amount.text.trim().replaceAll(',', '.')) ?? 0;
  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final order = await widget.api.addPayment(
        widget.order.id,
        amount: _value,
        method: _method,
        paidAt: _paidAt,
      );
      if (mounted) Navigator.pop(context, order);
    } catch (error) {
      if (mounted) showError(context, error);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Registrar pagamento')),
    body: Form(
      key: _form,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Saldo a receber: ${money(widget.order.remaining)}'),
          const SizedBox(height: 24),
          TextFormField(
            controller: _amount,
            decoration: const InputDecoration(labelText: 'Valor (R\$)'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: (_) => !_value.isFinite || _value <= 0
                ? 'Informe um valor positivo.'
                : _value > widget.order.remaining + 0.005
                ? 'O valor supera o saldo a receber.'
                : null,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _method,
            decoration: const InputDecoration(labelText: 'Forma de pagamento'),
            items: paymentMethods.entries
                .map(
                  (entry) => DropdownMenuItem(
                    value: entry.key,
                    child: Text(entry.value),
                  ),
                )
                .toList(),
            onChanged: _saving
                ? null
                : (value) => setState(() => _method = value!),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _saving
                ? null
                : () async {
                    final date = await pickDateTime(context, initial: _paidAt);
                    if (date != null && mounted) setState(() => _paidAt = date);
                  },
            icon: const Icon(Icons.event_outlined),
            label: Text(dateTimeLabel(_paidAt)),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Salvando…' : 'Confirmar pagamento'),
          ),
        ],
      ),
    ),
  );
}
