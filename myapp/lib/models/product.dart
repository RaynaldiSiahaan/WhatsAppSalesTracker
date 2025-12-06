class Product {
  final String? id;
  final String storeId;
  final String name;
  final double price;
  final int stockQuantity;
  final String? imageUrl;
  final String? imagePath; // Local path for images
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Product({
    this.id,
    required this.storeId,
    required this.name,
    required this.price,
    required this.stockQuantity,
    this.imageUrl,
    this.imagePath,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  // From JSON (API response)
  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      storeId: json['store_id'],
      name: json['name'],
      price: double.parse(json['price'].toString()),
      stockQuantity: json['stock_quantity'],
      imageUrl: json['image_url'],
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : null,
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at']) 
          : null,
    );
  }

  // To JSON (API request)
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'store_id': storeId,
      'name': name,
      'price': price,
      'stock_quantity': stockQuantity,
      if (imageUrl != null) 'image_url': imageUrl,
      'is_active': isActive,
    };
  }

  // From Database
  factory Product.fromMap(Map<String, dynamic> map) {
    return Product(
      id: map['id'],
      storeId: map['store_id'],
      name: map['name'],
      price: map['price'],
      stockQuantity: map['stock_quantity'],
      imageUrl: map['image_url'],
      imagePath: map['image_path'],
      isActive: map['is_active'] == 1,
      createdAt: map['created_at'] != null 
          ? DateTime.parse(map['created_at']) 
          : null,
      updatedAt: map['updated_at'] != null 
          ? DateTime.parse(map['updated_at']) 
          : null,
    );
  }

  // To Database
  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'store_id': storeId,
      'name': name,
      'price': price,
      'stock_quantity': stockQuantity,
      'image_url': imageUrl,
      'image_path': imagePath,
      'is_active': isActive ? 1 : 0,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  // Copy with
  Product copyWith({
    String? id,
    String? storeId,
    String? name,
    double? price,
    int? stockQuantity,
    String? imageUrl,
    String? imagePath,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Product(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      name: name ?? this.name,
      price: price ?? this.price,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      imageUrl: imageUrl ?? this.imageUrl,
      imagePath: imagePath ?? this.imagePath,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
