typedef Json = Map<String, dynamic>;

double amount(dynamic value) => (value as num?)?.toDouble() ?? 0;

const orderStatuses = {
  'orcamento': 'Orçamento',
  'confirmado': 'Confirmado',
  'produzindo': 'Produzindo',
  'pronto': 'Pronto',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado',
};

class Company {
  Company.fromJson(Json json)
    : id = json['id'] as String,
      name = json['name'] as String,
      inactive = json['inactive'] == true;
  final String id;
  final String name;
  final bool inactive;
}

class Session {
  Session.fromJson(Json json)
    : name = (json['user'] as Json)['name'] as String,
      email = (json['user'] as Json)['email'] as String,
      companyId = json['activeCompanyId'] as String,
      inactive = json['companyInactive'] == true,
      companies = (json['companies'] as List)
          .map((value) => Company.fromJson(value as Json))
          .toList();
  final String name;
  final String email;
  final String companyId;
  final bool inactive;
  final List<Company> companies;
  String get companyName =>
      companies
          .where((company) => company.id == companyId)
          .map((company) => company.name)
          .firstOrNull ??
      'Minha confeitaria';
}

class Customer {
  Customer.fromJson(Json json)
    : id = json['id'] as String,
      name = json['name'] as String,
      phone = json['phone'] as String? ?? '',
      email = json['email'] as String? ?? '',
      address = json['address'] as String? ?? '',
      notes = json['notes'] as String? ?? '';
  final String id;
  final String name;
  final String phone;
  final String email;
  final String address;
  final String notes;
}

class Order {
  Order.fromJson(this.json);
  final Json json;
  String get id => json['id'] as String;
  String get code => json['orderNumber'] as String;
  String get clientName =>
      json['clientName'] as String? ?? 'Cliente não cadastrado';
  String get status => json['status'] as String;
  double get total => amount(json['totalCharged']);
  DateTime? get deliveryDate =>
      DateTime.tryParse(json['deliveryDate'] as String? ?? '')?.toLocal();
  List<Json> get items => (json['items'] as List? ?? []).cast<Json>();
  List<Json> get payments => (json['payments'] as List? ?? []).cast<Json>();
  double get paid =>
      payments.fold(0, (sum, payment) => sum + amount(payment['amount']));
  double get remaining => (total - paid).clamp(0, double.infinity);
}

class FinanceSummary {
  FinanceSummary.fromJson(this.json);
  final Json json;
  double value(String key) => amount(json[key]);
  int get ordersCount => json['ordersCount'] as int? ?? 0;
}

class Product {
  Product.fromJson(this.json);
  final Json json;
  String get id => json['id'] as String;
  String get name => json['name'] as String;
  double get price => amount(json['salePrice']);
  double get cost => amount(json['calculatedCost']);
  List<Json> get materials => (json['materials'] as List? ?? []).cast<Json>();
}

class OrderDraft {
  OrderDraft({
    required this.products,
    required this.quantities,
    required this.materials,
  });
  final List<Product> products;
  final Map<String, int> quantities;
  final List<Json> materials;
  List<Json> get items =>
      products.where((p) => (quantities[p.id] ?? 0) > 0).map((p) {
        final quantity = quantities[p.id]!;
        return <String, dynamic>{
          'productId': p.id,
          'productName': p.name,
          'quantity': quantity,
          'unitPrice': p.price,
          'totalPrice': p.price * quantity,
          'unitCost': p.cost,
          'totalCost': p.cost * quantity,
        };
      }).toList();
  double get subtotal =>
      items.fold(0, (sum, item) => sum + amount(item['totalPrice']));
  double get cost =>
      items.fold(0, (sum, item) => sum + amount(item['totalCost']));

  Json toJson({
    required Customer customer,
    DateTime? deliveryDate,
    String notes = '',
  }) {
    final deductions = <String, double>{};
    for (final product in products) {
      final quantity = quantities[product.id] ?? 0;
      if (quantity <= 0) continue;
      for (final material in product.materials) {
        final id = material['materialId'] as String;
        deductions[id] =
            (deductions[id] ?? 0) + amount(material['quantity']) * quantity;
      }
    }
    final automaticMaterials = deductions.entries.map((entry) {
      final material = materials.firstWhere(
        (m) => m['id'] == entry.key,
        orElse: () => throw StateError(
          'Material da receita indisponível. Atualize e tente novamente.',
        ),
      );
      final unitCost = amount(material['unitCost']);
      return <String, dynamic>{
        'materialId': entry.key,
        'materialName': material['name'],
        'quantity': entry.value,
        'unitCost': unitCost,
        'totalCost': entry.value * unitCost,
        'isAutomatic': true,
      };
    }).toList();
    final profit = subtotal - cost;
    return {
      'customerId': customer.id,
      'clientName': customer.name,
      'clientPhone': customer.phone,
      'clientAddress': customer.address,
      'deliveryDate': deliveryDate?.toUtc().toIso8601String(),
      'status': 'orcamento',
      'items': items,
      'materials': automaticMaterials,
      'subtotal': subtotal,
      'discount': 0,
      'totalCharged': subtotal,
      'estimatedCost': cost,
      'estimatedProfit': profit,
      'profitMarginPercent': subtotal > 0 ? profit / subtotal * 100 : 0,
      'notes': notes.trim(),
    };
  }
}
