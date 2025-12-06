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

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
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
        
        // Save first store ID if exists
        if (stores.isNotEmpty) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(AppConstants.keyStoreId, stores.first.id);
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
}
