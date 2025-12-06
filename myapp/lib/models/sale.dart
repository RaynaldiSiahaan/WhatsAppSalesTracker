class Sale {
  final String? id;
  final String storeId;
  final String productId;
  final String productName;
  final int quantity;
  final double priceAtSale;
  final double totalAmount;
  final DateTime createdAt;

  Sale({
    this.id,
    required this.storeId,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.priceAtSale,
    required this.totalAmount,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  // From Database
  factory Sale.fromMap(Map<String, dynamic> map) {
    return Sale(
      id: map['id'],
      storeId: map['store_id'],
      productId: map['product_id'],
      productName: map['product_name'],
      quantity: map['quantity'],
      priceAtSale: map['price_at_sale'],
      totalAmount: map['total_amount'],
      createdAt: DateTime.parse(map['created_at']),
    );
  }

  // To Database
  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'store_id': storeId,
      'product_id': productId,
      'product_name': productName,
      'quantity': quantity,
      'price_at_sale': priceAtSale,
      'total_amount': totalAmount,
      'created_at': createdAt.toIso8601String(),
    };
  }

  // From JSON (API response)
  factory Sale.fromJson(Map<String, dynamic> json) {
    return Sale(
      id: json['id'],
      storeId: json['store_id'],
      productId: json['product_id'],
      productName: json['name'],
      quantity: json['quantity'],
      priceAtSale: double.parse(json['price_at_order'].toString()),
      totalAmount: double.parse(json['price_at_order'].toString()) * json['quantity'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
