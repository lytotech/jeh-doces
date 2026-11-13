import 'package:material_ui/material_ui.dart';

import '../core/api_client.dart';
import '../core/models.dart';
import 'common.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key, required this.api});
  final ApiClient api;
  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  late Future<List<Customer>> _future;
  String _search = '';
  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = widget.api.customers();
  }

  Future<void> _edit([Customer? customer]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CustomerFormScreen(api: widget.api, customer: customer),
      ),
    );
    if (saved == true && mounted) setState(_load);
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
                  hintText: 'Buscar cliente',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (value) => setState(() => _search = value),
              ),
            ),
            const SizedBox(width: 12),
            IconButton.filled(
              tooltip: 'Novo cliente',
              onPressed: () => _edit(),
              icon: const Icon(Icons.add),
            ),
          ],
        ),
      ),
      Expanded(
        child: AsyncContent<List<Customer>>(
          future: _future,
          retry: () => setState(_load),
          builder: (customers) {
            final filtered = customers
                .where(
                  (c) => '${c.name} ${c.phone}'.toLowerCase().contains(
                    _search.toLowerCase(),
                  ),
                )
                .toList();
            return RefreshIndicator(
              onRefresh: () async {
                setState(_load);
                await _future;
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  if (filtered.isEmpty)
                    const EmptyContent(
                      'Nenhum cliente encontrado. Cadastre seu primeiro cliente.',
                    ),
                  ...filtered.map(
                    (customer) => ListTile(
                      leading: CircleAvatar(
                        child: Text(
                          customer.name.isEmpty
                              ? '?'
                              : customer.name.characters.first.toUpperCase(),
                        ),
                      ),
                      title: Text(customer.name),
                      subtitle: Text(
                        customer.phone.isEmpty
                            ? customer.email
                            : customer.phone,
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => _edit(customer),
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

class CustomerFormScreen extends StatefulWidget {
  const CustomerFormScreen({super.key, required this.api, this.customer});
  final ApiClient api;
  final Customer? customer;
  @override
  State<CustomerFormScreen> createState() => _CustomerFormScreenState();
}

class _CustomerFormScreenState extends State<CustomerFormScreen> {
  final _form = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.customer?.name);
  late final _phone = TextEditingController(text: widget.customer?.phone);
  late final _email = TextEditingController(text: widget.customer?.email);
  late final _address = TextEditingController(text: widget.customer?.address);
  late final _notes = TextEditingController(text: widget.customer?.notes);
  bool _saving = false;
  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.api.saveCustomer({
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
        'email': _email.text.trim(),
        'address': _address.text.trim(),
        'notes': _notes.text.trim(),
      }, id: widget.customer?.id);
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) showError(context, error);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _address, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(widget.customer == null ? 'Novo cliente' : 'Editar cliente'),
    ),
    body: Form(
      key: _form,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextFormField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Nome'),
            textCapitalization: TextCapitalization.words,
            validator: (value) => value == null || value.trim().isEmpty
                ? 'Informe o nome.'
                : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _phone,
            decoration: const InputDecoration(labelText: 'Telefone'),
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _email,
            decoration: const InputDecoration(labelText: 'E-mail'),
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _address,
            decoration: const InputDecoration(labelText: 'Endereço'),
            textCapitalization: TextCapitalization.sentences,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _notes,
            decoration: const InputDecoration(labelText: 'Observações'),
            maxLines: 3,
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Salvando…' : 'Salvar cliente'),
          ),
        ],
      ),
    ),
  );
}
