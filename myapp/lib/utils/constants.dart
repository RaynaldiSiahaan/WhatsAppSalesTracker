import 'package:flutter/material.dart';

class AppConstants {
  // Colors - Blue theme for middle-aged women
  static const Color primaryBlue = Color(0xFF2196F3);
  static const Color lightBlue = Color(0xFF64B5F6);
  static const Color darkBlue = Color(0xFF1976D2);
  static const Color accentBlue = Color(0xFF03A9F4);
  static const Color backgroundGrey = Color(0xFFF5F5F5);
  static const Color cardWhite = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFF212121);
  static const Color textGrey = Color(0xFF757575);
  static const Color successGreen = Color(0xFF4CAF50);
  static const Color errorRed = Color(0xFFF44336);
  
  // Typography
  static const double fontSizeLarge = 20.0;
  static const double fontSizeMedium = 16.0;
  static const double fontSizeSmall = 14.0;
  
  // Spacing
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  
  // Border Radius
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  
  // Button sizes (large for easy tapping)
  static const double buttonHeight = 56.0;
  static const double iconButtonSize = 48.0;
  
  // API Endpoints
  static const String authRegisterEndpoint = '/api/auth/register';
  static const String authLoginEndpoint = '/api/auth/login';
  static const String authRefreshEndpoint = '/api/auth/refresh';
  static const String storesEndpoint = '/api/stores';
  static const String myStoresEndpoint = '/api/stores/my';
  static const String productsEndpoint = '/api/stores';
  static const String publicCatalogEndpoint = '/api/public/catalog';
  static const String dashboardStatsEndpoint = '/api/seller/dashboard/stats';
  // Note: sellerOrdersEndpoint removed - not yet available in API contract

  // Storage Keys
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserId = 'user_id';
  static const String keyUserEmail = 'user_email';
  static const String keyStoreId = 'store_id';
  static const String keyStoreSlug = 'store_slug';
  
  // Image
  static const int imageQuality = 70;
  static const int imageMaxWidth = 1024;
  static const int imageMaxHeight = 1024;
}
