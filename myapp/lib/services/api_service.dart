import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product.dart';
import '../models/store.dart';
import '../utils/constants.dart';

class ApiService {
  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'https://api.yangpentingbisa.web.id/';
  
  // Get stored auth token
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.keyAccessToken);
  }

  // Save auth tokens
  Future<void> _saveTokens(String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyAccessToken, accessToken);
    await prefs.setString(AppConstants.keyRefreshToken, refreshToken);
  }

  // Headers with auth
  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ========== AUTH ==========
  
  Future<Map<String, dynamic>> register(String email, String password) async {
    try {
      print('🌐 Calling: $baseUrl/api/auth/register'); 

      final response = await http.post(
        Uri.parse('$baseUrl${AppConstants.authRegisterEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success']) {
        return data;
      } else {
        throw Exception(data['error'] ?? 'Registrasi gagal');
      }
    } catch (e) {
      throw Exception('Error registrasi: $e');
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
          final url = '$baseUrl${AppConstants.authLoginEndpoint}';
          print('🔥 LOGIN URL: $url');

      final response = await http.post(
        Uri.parse('$baseUrl${AppConstants.authLoginEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success']) {
        // Save tokens
        await _saveTokens(
          data['data']['accessToken'],
          data['data']['refreshToken'],
        );
        
        // Save user info
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.keyUserId, data['data']['user']['id']);
        await prefs.setString(AppConstants.keyUserEmail, data['data']['user']['email']);
        
        return data;
      } else {
        throw Exception(data['error'] ?? 'Login gagal');
      }
    } catch (e) {
      throw Exception('Error login: $e');
    }
  }

  /// Logout - clear ALL user session data to prevent data leakage between users
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    // CRITICAL: Clear ALL user-related data on logout to prevent data mixing
    await prefs.remove(AppConstants.keyAccessToken);
    await prefs.remove(AppConstants.keyRefreshToken);
    await prefs.remove(AppConstants.keyUserId);
    await prefs.remove(AppConstants.keyUserEmail);
    await prefs.remove(AppConstants.keyStoreId);
    await prefs.remove(AppConstants.keyStoreSlug);
  }

  /// Check if token is still valid, refresh if needed
  Future<bool> refreshTokenIfNeeded() async {
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString(AppConstants.keyRefreshToken);

    if (refreshToken == null) return false;

    try {
      final response = await http.post(
        Uri.parse('$baseUrl${AppConstants.authRefreshEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success']) {
        await _saveTokens(
          data['data']['accessToken'],
          data['data']['refreshToken'],
        );
        return true;
      }
      return false;
    } catch (e) {
      print('⚠️ Token refresh failed: $e');
      return false;
    }
  }

  /// Get current user ID from storage
  Future<String?> getCurrentUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.keyUserId);
  }

  /// Get current store ID from storage
  Future<String?> getCurrentStoreId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.keyStoreId);
  }

  // ========== STORES ==========
  
  Future<Store> createStore(String name, String? location) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl${AppConstants.storesEndpoint}'),
        headers: headers,
        body: jsonEncode({
          'name': name,
          if (location != null) 'location': location,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success']) {
        final store = Store.fromJson(data['data']);
        
        // Save store ID
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.keyStoreId, store.id);
        
        return store;
      } else {
        throw Exception(data['error'] ?? 'Gagal membuat toko');
      }
    } catch (e) {
      throw Exception('Error membuat toko: $e');
    }
  }

  Future<List<Store>> getMyStores() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl${AppConstants.myStoresEndpoint}'),
        headers: headers,
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success']) {
        final List<dynamic> storesJson = data['data'];
        final stores = storesJson.map((json) => Store.fromJson(json)).toList();

        // Save first store ID and slug if exists
        if (stores.isNotEmpty) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(AppConstants.keyStoreId, stores.first.id);
          await prefs.setString(AppConstants.keyStoreSlug, stores.first.slug);
          print('Saved store_id: ${stores.first.id}, slug: ${stores.first.slug}');
        }

        return stores;
      } else {
        throw Exception(data['error'] ?? 'Gagal mengambil data toko');
      }
    } catch (e) {
      throw Exception('Error mengambil toko: $e');
    }
  }

  // ========== PRODUCTS ==========
  
  Future<Product> createProduct(String storeId, Product product) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl${AppConstants.productsEndpoint}/$storeId/products'),
        headers: headers,
        body: jsonEncode({
          'name': product.name,
          'price': product.price,
          'stock_quantity': product.stockQuantity,
          if (product.imageUrl != null) 'image_url': product.imageUrl,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success']) {
        return Product.fromJson(data['data']);
      } else {
        throw Exception(data['error'] ?? 'Gagal menambah produk');
      }
    } catch (e) {
      throw Exception('Error menambah produk: $e');
    }
  }

  Future<Product> updateProductStock(String productId, int newStock) async {
    try {
      final headers = await _getHeaders();
      final response = await http.patch(
        Uri.parse('$baseUrl/api/products/$productId/stock'),
        headers: headers,
        body: jsonEncode({
          'newQuantity': newStock,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success']) {
        return Product.fromJson(data['data']);
      } else {
        throw Exception(data['error'] ?? 'Gagal update stok');
      }
    } catch (e) {
      throw Exception('Error update stok: $e');
    }
  }

  Future<void> deleteProduct(String productId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/api/products/$productId'),
        headers: headers,
      );

      final data = jsonDecode(response.body);

      if (response.statusCode != 200 || !data['success']) {
        throw Exception(data['error'] ?? 'Gagal menghapus produk');
      }
    } catch (e) {
      throw Exception('Error menghapus produk: $e');
    }
  }

  // ========== PUBLIC CATALOG ==========

  /// Get public catalog (store info + products) using store slug
  /// This is the only way to fetch products from the API
  Future<Map<String, dynamic>> getPublicCatalog(String slug) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl${AppConstants.publicCatalogEndpoint}/$slug'),
        headers: {'Content-Type': 'application/json'},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success']) {
        return data['data'];
      } else {
        throw Exception(data['error'] ?? 'Gagal mengambil katalog');
      }
    } catch (e) {
      throw Exception('Error mengambil katalog: $e');
    }
  }

  /// Get products from public catalog
  Future<List<Product>> getProductsFromCatalog(String slug) async {
    try {
      final catalogData = await getPublicCatalog(slug);
      final List<dynamic> productsJson = catalogData['products'] ?? [];

      // Get store_id from the catalog response
      final storeId = catalogData['store']?['id']?.toString() ?? '';

      return productsJson.map((json) {
        // Add store_id to product json if not present
        json['store_id'] = json['store_id'] ?? storeId;
        return Product.fromJson(json);
      }).toList();
    } catch (e) {
      throw Exception('Error mengambil produk dari katalog: $e');
    }
  }

  // ========== DASHBOARD ==========

  /// Get dashboard statistics from API
  /// Supports filtering by storeId, startDate, and endDate
  Future<DashboardStats> getDashboardStats({
    String? storeId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final headers = await _getHeaders();

      // Build query parameters
      final queryParams = <String, String>{};
      if (storeId != null) queryParams['storeId'] = storeId;
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String().split('T')[0];
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String().split('T')[0];
      }

      final uri = Uri.parse('$baseUrl${AppConstants.dashboardStatsEndpoint}')
          .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

      final response = await http.get(uri, headers: headers);
      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success']) {
        return DashboardStats.fromJson(data['data']);
      } else {
        throw Exception(data['error'] ?? 'Gagal mengambil statistik dashboard');
      }
    } catch (e) {
      throw Exception('Error mengambil statistik dashboard: $e');
    }
  }

  // ========== ORDERS ==========
  // NOTE: The API contract does not include a GET /api/seller/orders endpoint yet.
  // Order management features are temporarily disabled until the backend implements this endpoint.
  // For now, only dashboard stats (total orders count) is available via /api/seller/dashboard/stats
}

/// Dashboard statistics model
class DashboardStats {
  final int totalStores;
  final int totalProducts;
  final int totalOrdersReceived;
  final double totalRevenue;

  DashboardStats({
    required this.totalStores,
    required this.totalProducts,
    required this.totalOrdersReceived,
    required this.totalRevenue,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalStores: json['total_stores'] ?? 0,
      totalProducts: json['total_products'] ?? 0,
      totalOrdersReceived: json['total_orders_received'] ?? 0,
      totalRevenue: double.tryParse(json['total_revenue'].toString()) ?? 0.0,
    );
  }
}
