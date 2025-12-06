import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product.dart';
import '../models/sale.dart';
import '../database/database_helper.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class ProductProvider with ChangeNotifier {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;
  final ApiService _apiService = ApiService();
  
  List<Product> _products = [];
  List<Sale> _sales = [];
  bool _isLoading = false;
  String? _error;
  String? _storeId;

  List<Product> get products => _products;
  List<Sale> get sales => _sales;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get storeId => _storeId;

  // Initialize - load store ID and products
  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _storeId = prefs.getString(AppConstants.keyStoreId);
    
    if (_storeId != null) {
      await loadProducts();
      await loadSales();
    }
  }

  // Load products from local DB
  Future<void> loadProducts() async {
    if (_storeId == null) return;
    
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _products = await _dbHelper.getProducts(_storeId!);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Add product (local + API)
  Future<void> addProduct(Product product) async {
    if (_storeId == null) throw Exception('Store ID tidak ditemukan');
    
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Try API first
      try {
        final apiProduct = await _apiService.createProduct(_storeId!, product);
        await _dbHelper.insertProduct(apiProduct);
      } catch (apiError) {
        // Fallback to local only
        await _dbHelper.insertProduct(product);
      }

      await loadProducts();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Update product stock
  Future<void> updateProductStock(String productId, int newStock) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Try API first
      try {
        await _apiService.updateProductStock(productId, newStock);
      } catch (apiError) {
        // Continue with local update even if API fails
      }

      await _dbHelper.updateProductStock(productId, newStock);
      await loadProducts();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Delete product
  Future<void> deleteProduct(String productId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Try API first
      try {
        await _apiService.deleteProduct(productId);
      } catch (apiError) {
        // Continue with local delete even if API fails
      }

      await _dbHelper.deleteProduct(productId);
      await loadProducts();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Record a sale
  Future<void> recordSale(String productId, int quantity) async {
    if (_storeId == null) throw Exception('Store ID tidak ditemukan');
    
    try {
      final product = _products.firstWhere((p) => p.id == productId);
      
      if (product.stockQuantity < quantity) {
        throw Exception('Stok tidak cukup');
      }

      // Create sale record
      final sale = Sale(
        storeId: _storeId!,
        productId: productId,
        productName: product.name,
        quantity: quantity,
        priceAtSale: product.price,
        totalAmount: product.price * quantity,
      );

      // Save sale
      await _dbHelper.insertSale(sale);

      // Update stock
      await updateProductStock(productId, product.stockQuantity - quantity);
      
      await loadSales();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // Load sales
  Future<void> loadSales({DateTime? startDate, DateTime? endDate}) async {
    if (_storeId == null) return;
    
    try {
      _sales = await _dbHelper.getSales(_storeId!, startDate: startDate, endDate: endDate);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Get revenue
  Future<double> getRevenue({DateTime? startDate, DateTime? endDate}) async {
    if (_storeId == null) return 0.0;
    return await _dbHelper.getTotalRevenue(_storeId!, startDate: startDate, endDate: endDate);
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
