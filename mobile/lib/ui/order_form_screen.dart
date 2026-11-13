import 'package:material_ui/material_ui.dart';

import '../core/api_client.dart';
import '../core/models.dart';
import 'common.dart';

class OrderFormScreen extends StatefulWidget {
  const OrderFormScreen({super.key, required this.api});
  final ApiClient api;
  @override
  State<OrderFormScreen> createState() => _OrderFormScreenState();
}

class _OrderFormScreenState extends State<OrderFormScreen> {
  final _form = GlobalKey<FormState>();
  final _notes = TextEditingController();
  late Future<(List<Customer>, List<Product>, List<Json>)> _future;
  final _quantities = <String, int>{};
  Customer? _customer;
  DateTime? _deliveryDate;
  bool _saving = false;
  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = (
      widget.api.customers(),
      widget.api.products(),
      widget.api.materials(),
    ).wait;
  }

  Future<void> _save(OrderDraft draft) async {
    if (_saving || !_form.currentState!.validate()) return;
    if (draft.items.isEmpty) {
      showError(context, 'Adicione pelo menos um produto.');
      return;
    }
    setState(() => _saving = true);
    try {
      await widget.api.createOrder(
        draft.toJson(
          customer: _customer!,
          deliveryDate: _deliveryDate,
          notes: _notes.text,
        ),
      );
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) showError(context, error);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Novo orçamento')),
    body: AsyncContent<(List<Customer>, List<Product>, List<Json>)>(
      future: _future,
      retry: () => setState(_load),
      builder: (data) {
        final draft = OrderDraft(
          products: data.$2,
          quantities: _quantities,
          materials: data.$3,
        );
        return Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (data.$1.isEmpty)
                const Text(
                  'Cadastre um cliente na aba Clientes antes de criar o pedido.',
                ),
              DropdownButtonFormField<Customer>(
                initialValue: _customer,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Cliente'),
                items: data.$1
                    .map(
                      (customer) => DropdownMenuItem(
                        value: customer,
                        child: Text(customer.name),
                      ),
                    )
                    .toList(),
                onChanged: _saving
                    ? null
                    : (customer) => setState(() => _customer = customer),
                validator: (customer) =>
                    customer == null ? 'Selecione um cliente.' : null,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _saving
                    ? null
                    : () async {
                        final value = await pickDateTime(
                          context,
                          initial: _deliveryDate,
                        );
                        if (value != null && mounted) {
                          setState(() => _deliveryDate = value);
                        }
                      },
                icon: const Icon(Icons.event_outlined),
                label: Text(dateTimeLabel(_deliveryDate)),
              ),
              const SizedBox(height: 24),
              Text('Produtos', style: Theme.of(context).textTheme.titleLarge),
              if (data.$2.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text(
                    'Cadastre produtos e suas receitas no sistema web para criar pedidos.',
                  ),
                ),
              ...data.$2.map((product) {
                final quantity = _quantities[product.id] ?? 0;
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Row(
                          children: [
                            Expanded(child: Text(money(product.price))),
                            IconButton(
                              tooltip: 'Diminuir quantidade de ${product.name}',
                              onPressed: _saving || quantity == 0
                                  ? null
                                  : () => setState(
                                      () => _quantities[product.id] =
                                          quantity - 1,
                                    ),
                              icon: const Icon(Icons.remove_circle_outline),
                            ),
                            Text('$quantity'),
                            IconButton(
                              tooltip: 'Aumentar quantidade de ${product.name}',
                              onPressed: _saving
                                  ? null
                                  : () => setState(
                                      () => _quantities[product.id] =
                                          quantity + 1,
                                    ),
                              icon: const Icon(Icons.add_circle_outline),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 16),
              TextFormField(
                controller: _notes,
                decoration: const InputDecoration(labelText: 'Observações'),
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              Text(
                'Total: ${money(draft.subtotal)}',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text('Custo estimado: ${money(draft.cost)}'),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _saving ? null : () => _save(draft),
                child: Text(_saving ? 'Salvando…' : 'Criar orçamento'),
              ),
            ],
          ),
        );
      },
    ),
  );
}
