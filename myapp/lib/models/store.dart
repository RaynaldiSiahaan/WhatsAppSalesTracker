class Store {
  final String id;
  final String userId;
  final String name;
  final String slug;
  final String storeCode;
  final String? location;
  final DateTime createdAt;
  final DateTime updatedAt;

  Store({
    required this.id,
    required this.userId,
    required this.name,
    required this.slug,
    required this.storeCode,
    this.location,
    required this.createdAt,
    required this.updatedAt,
  });

  // From JSON (API response)
  factory Store.fromJson(Map<String, dynamic> json) {
    return Store(
      id: json['id'].toString(),
      userId: json['user_id']?.toString() ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      storeCode: json['store_code'] ?? '',
      location: json['location'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : DateTime.now(),
    );
  }

  // To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'slug': slug,
      'store_code': storeCode,
      'location': location,
    };
  }
}
