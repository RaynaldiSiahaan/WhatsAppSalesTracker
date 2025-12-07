import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../database/database_helper.dart';
import '../utils/constants.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;
  String? _userEmail;
  String? _userId;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get userEmail => _userEmail;
  String? get userId => _userId;

  // Check if user is logged in
  Future<void> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.keyAccessToken);
    _userEmail = prefs.getString(AppConstants.keyUserEmail);
    _userId = prefs.getString(AppConstants.keyUserId);
    _isAuthenticated = token != null;
    notifyListeners();
  }

  // Register
  Future<bool> register(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _apiService.register(email, password);
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Login
  Future<bool> login(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _apiService.login(email, password);

      _isAuthenticated = true;
      _userEmail = email;

      // CRITICAL: Fetch stores and wait for completion
      // This ensures store_id is saved before ProductProvider.initialize() is called
      final stores = await _apiService.getMyStores();
      if (stores.isEmpty) {
        print('Warning: User has no stores');
      } else {
        print('Login successful: Found ${stores.length} store(s), active store: ${stores.first.id}');
      }

      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      _isAuthenticated = false;
      notifyListeners();
      return false;
    }
  }

  /// Logout - Clear session data but preserve local product data
  /// Products are isolated by store_id in database queries, so no data leakage between users
  Future<void> logout() async {
    try {
      // Clear API tokens and user data from SharedPreferences
      await _apiService.logout();

      // NOTE: Do NOT clear local database here!
      // Products are filtered by store_id in database queries (database_helper.dart:85)
      // Each user has their own store_id, so products are already isolated
      // Clearing would cause data loss since there's no GET endpoint to restore products

      // Reset in-memory state
      _isAuthenticated = false;
      _userEmail = null;
      _userId = null;
      _error = null;

      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
