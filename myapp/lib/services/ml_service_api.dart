import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math';
import '../models/sale.dart';

class MLService {
  // API Configuration
  // Update this URL after deploying to Railway/Render
  static const String _apiUrl = 'http://10.0.2.2:5000/predict'; // Android emulator
  // For iOS simulator: 'http://localhost:5000/predict'
  // For production: 'https://your-app.railway.app/predict'

  bool _apiAvailable = true;
  String? _lastError;

  // Public getter to check if using fallback mode
  bool get isUsingFallback => !_apiAvailable;
  String? get lastError => _lastError;

  double _calculateEWM(List<double> values, {int span = 7}) {
    if (values.isEmpty) return 0;

    final alpha = 2 / (span + 1);
    double result = values[0];

    for (int i = 1; i < values.length; i++) {
      result = alpha * values[i] + (1 - alpha) * result;
    }

    return result;
  }

  // Advanced statistical forecasting with trend analysis and seasonality
  List<Map<String, dynamic>> _simpleForecasting({
    required List<Sale> historicalSales,
    int days = 3,
  }) {
    historicalSales.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    final quantities =
        historicalSales.map((s) => s.quantity.toDouble()).toList();
    final dates = historicalSales.map((s) => s.createdAt).toList();

    // Calculate exponential weighted moving average
    final ewm = _calculateEWM(quantities, span: 7);

    // Calculate trend (linear regression on recent data)
    final recentCount = min(7, quantities.length);
    final recentQuantities =
        quantities.sublist(quantities.length - recentCount);

    double trend = 0.0;
    if (recentCount >= 3) {
      double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (int i = 0; i < recentCount; i++) {
        sumX += i;
        sumY += recentQuantities[i];
        sumXY += i * recentQuantities[i];
        sumX2 += i * i;
      }
      trend = (recentCount * sumXY - sumX * sumY) /
          (recentCount * sumX2 - sumX * sumX);
    }

    // Detect weekly seasonality (weekend vs weekday pattern)
    final weekdayAvg = <double>[];
    final weekendAvg = <double>[];
    for (int i = 0; i < quantities.length; i++) {
      if (dates[i].weekday >= 6) {
        weekendAvg.add(quantities[i]);
      } else {
        weekdayAvg.add(quantities[i]);
      }
    }

    final avgWeekday = weekdayAvg.isEmpty
        ? 0.0
        : weekdayAvg.reduce((a, b) => a + b) / weekdayAvg.length;
    final avgWeekend = weekendAvg.isEmpty
        ? 0.0
        : weekendAvg.reduce((a, b) => a + b) / weekendAvg.length;
    final seasonalityFactor =
        avgWeekend > 0 && avgWeekday > 0 ? avgWeekend / avgWeekday : 1.0;

    final lastDate = historicalSales.last.createdAt;
    final forecasts = <Map<String, dynamic>>[];

    for (int day = 1; day <= days; day++) {
      final forecastDate = lastDate.add(Duration(days: day));

      // Base forecast: EWM + trend
      double baseForecast = ewm + (trend * day);

      // Apply seasonality adjustment
      final isWeekend = forecastDate.weekday >= 6;
      if (isWeekend && seasonalityFactor > 1.0) {
        baseForecast *= seasonalityFactor;
      } else if (!isWeekend && seasonalityFactor < 1.0) {
        baseForecast *= (2.0 - seasonalityFactor);
      }

      // Add some variance reduction (moving toward mean)
      final avgRecent =
          recentQuantities.reduce((a, b) => a + b) / recentQuantities.length;
      final forecast = (baseForecast * 0.75 + avgRecent * 0.25).round();

      forecasts.add({
        'date': forecastDate,
        'forecast': max(0, forecast),
      });
    }

    return forecasts;
  }

  Future<List<Map<String, dynamic>>> forecast({
    required int outletId,
    required int productId,
    required List<Sale> historicalSales,
    int days = 3,
    bool useFallback = false,
  }) async {
    if (historicalSales.length < 7) {
      throw Exception('Need at least 7 days of historical data');
    }

    // If forced fallback or API unavailable, use statistical forecasting
    if (useFallback || !_apiAvailable) {
      print('Using statistical forecasting (fallback mode)');
      return _simpleForecasting(historicalSales: historicalSales, days: days);
    }

    // Try API prediction first
    try {
      print('Attempting API prediction...');

      // Prepare request data
      final requestData = {
        'outlet_id': outletId,
        'product_id': productId,
        'historical_sales': historicalSales
            .map((sale) => {
                  'date': sale.createdAt.toIso8601String(),
                  'quantity': sale.quantity,
                })
            .toList(),
        'days': days,
      };

      // Call API with timeout
      final response = await http
          .post(
            Uri.parse(_apiUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(requestData),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['success'] == true) {
          print('✓ API prediction successful');
          _apiAvailable = true;
          _lastError = null;

          // Parse forecasts
          return (data['forecasts'] as List)
              .map((f) => {
                    'date': DateTime.parse(f['date']),
                    'forecast': f['forecast'],
                  })
              .toList();
        } else {
          throw Exception(data['error'] ?? 'Unknown API error');
        }
      } else {
        throw Exception('API returned status ${response.statusCode}');
      }
    } catch (e) {
      print('✗ API prediction failed: $e');
      _apiAvailable = false;
      _lastError = e.toString();

      // Fallback to statistical method
      print('Falling back to statistical forecasting');
      return _simpleForecasting(historicalSales: historicalSales, days: days);
    }
  }

  // Test API connection
  Future<bool> testConnection() async {
    try {
      final response = await http
          .get(Uri.parse(_apiUrl.replaceAll('/predict', '/')))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _apiAvailable = data['model_loaded'] == true;
        return _apiAvailable;
      }
      return false;
    } catch (e) {
      print('API connection test failed: $e');
      _apiAvailable = false;
      return false;
    }
  }

  void dispose() {
    // Cleanup if needed
  }
}
