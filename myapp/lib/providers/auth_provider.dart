import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../database/database_helper.dart';
import '../utils/constants.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;
  String? _userEmail;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get userEmail => _userEmail;

  // Check if user is logged in
  Future<void> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.keyAccessToken);
    _userEmail = prefs.getString(AppConstants.keyUserEmail);
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

      final response = await _apiService.login(email, password);
      
      _isAuthenticated = true;
      _userEmail = email;
      try {
  await _apiService.getMyStores();  // This already saves store_id internally
} catch (e) {
  print('Failed to fetch stores: $e');
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

  // Logout
  Future<void> logout() async {
    try {
      await _apiService.logout();
      await DatabaseHelper.instance.clearAllData();
      
      _isAuthenticated = false;
      _userEmail = null;
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
