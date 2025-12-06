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
      id: json['id'],
      userId: json['user_id'],
      name: json['name'],
      slug: json['slug'],
      storeCode: json['store_code'],
      location: json['location'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
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
