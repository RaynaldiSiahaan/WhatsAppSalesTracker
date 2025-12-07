import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/product_provider.dart';
import '../services/ml_service.dart';
import '../utils/constants.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  double _dailyRevenue = 0.0;
  double _weeklyRevenue = 0.0;
  String? _selectedProductId;
  List<FlSpot> _salesData = [];

  // ML Forecasting
  final MLService _mlService = MLService();
  List<Map<String, dynamic>> _forecasts = [];
  bool _isLoadingForecast = false;
  String? _forecastError;

  @override
  void initState() {
    super.initState();
    _loadRevenue();
    _loadSalesData();
    _loadForecasts();
  }

  @override
  void dispose() {
    _mlService.dispose();
    super.dispose();
  }

  Future<void> _loadRevenue() async {
    final provider = Provider.of<ProductProvider>(context, listen: false);

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = DateTime(now.year, now.month, now.day, 23, 59, 59);

    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekStartDate = DateTime(weekStart.year, weekStart.month, weekStart.day);

    // Load sales filtered by product
    await provider.loadSales(startDate: todayStart, endDate: todayEnd);
    final todaySales = _selectedProductId == null
        ? provider.sales
        : provider.sales.where((s) => s.productId == _selectedProductId).toList();

    await provider.loadSales(startDate: weekStartDate, endDate: todayEnd);
    final weekSales = _selectedProductId == null
        ? provider.sales
        : provider.sales.where((s) => s.productId == _selectedProductId).toList();

    setState(() {
      _dailyRevenue = todaySales.fold(0.0, (sum, sale) => sum + sale.totalAmount);
      _weeklyRevenue = weekSales.fold(0.0, (sum, sale) => sum + sale.totalAmount);
    });
  }

  Future<void> _loadSalesData() async {
    final provider = Provider.of<ProductProvider>(context, listen: false);

    final now = DateTime.now();
    final weekStart = now.subtract(const Duration(days: 7));

    await provider.loadSales(startDate: weekStart, endDate: now);

    // Filter by product if selected
    final sales = _selectedProductId == null
        ? provider.sales
        : provider.sales.where((s) => s.productId == _selectedProductId).toList();

    // Group by day
    Map<int, double> dailyTotals = {};
    for (var sale in sales) {
      final dayIndex = sale.createdAt.difference(weekStart).inDays;
      dailyTotals[dayIndex] = (dailyTotals[dayIndex] ?? 0) + sale.quantity.toDouble();
    }

    setState(() {
      _salesData = List.generate(7, (i) {
        return FlSpot(i.toDouble(), dailyTotals[i] ?? 0);
      });
    });
  }

  Future<void> _loadForecasts() async {
    final provider = Provider.of<ProductProvider>(context, listen: false);

    if (provider.sales.isEmpty) {
      setState(() {
        _forecastError = 'Belum ada data penjualan untuk prediksi';
      });
      return;
    }

    setState(() {
      _isLoadingForecast = true;
      _forecastError = null;
    });

    try {
      await _mlService.initialize();

      // Get sales data for forecasting
      final now = DateTime.now();
      final twoWeeksAgo = now.subtract(const Duration(days: 14));
      await provider.loadSales(startDate: twoWeeksAgo, endDate: now);

      final sales = _selectedProductId == null
          ? provider.sales
          : provider.sales.where((s) => s.productId == _selectedProductId).toList();

      if (sales.length < 7) {
        setState(() {
          _forecastError = 'Minimal 7 hari data penjualan diperlukan';
          _isLoadingForecast = false;
        });
        return;
      }

      // Get outlet and product IDs for the model
      final outletId = provider.storeId?.hashCode ?? 1;
      final productId = _selectedProductId?.hashCode ?? 1;

      final forecasts = await _mlService.forecast(
        outletId: outletId,
        productId: productId,
        historicalSales: sales,
        days: 3,
      );

      setState(() {
        _forecasts = forecasts;
        _isLoadingForecast = false;
      });
    } catch (e) {
      setState(() {
        _forecastError = 'Prediksi memerlukan lebih banyak data';
        _isLoadingForecast = false;
      });
    }
  }

  Future<void> _refreshAll() async {
    await _loadRevenue();
    await _loadSalesData();
    await _loadForecasts();
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Scaffold(
      backgroundColor: AppConstants.backgroundGrey,
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: AppConstants.primaryBlue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshAll,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshAll,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppConstants.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Filter
              Consumer<ProductProvider>(
                builder: (context, provider, _) {
                  return Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.paddingMedium),
                      child: DropdownButtonFormField<String?>(
                        decoration: const InputDecoration(
                          labelText: 'Filter Produk',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        value: _selectedProductId,
                        items: [
                          const DropdownMenuItem(
                            value: null,
                            child: Text('Semua Produk'),
                          ),
                          ...provider.products.map((product) {
                            return DropdownMenuItem(
                              value: product.id,
                              child: Text(product.name),
                            );
                          }),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedProductId = value;
                          });
                          _refreshAll();
                        },
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: AppConstants.paddingMedium),

              // Revenue Cards
              Row(
                children: [
                  Expanded(
                    child: _RevenueCard(
                      title: 'Hari Ini',
                      amount: formatter.format(_dailyRevenue),
                      icon: Icons.today,
                      color: AppConstants.primaryBlue,
                    ),
                  ),
                  const SizedBox(width: AppConstants.paddingMedium),
                  Expanded(
                    child: _RevenueCard(
                      title: 'Minggu Ini',
                      amount: formatter.format(_weeklyRevenue),
                      icon: Icons.calendar_today,
                      color: AppConstants.successGreen,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingLarge),

              // Sales Chart
              Text(
                'Grafik Penjualan (7 Hari Terakhir)',
                style: TextStyle(
                  fontSize: AppConstants.fontSizeLarge,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textDark,
                ),
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              _SalesChart(salesData: _salesData),
              const SizedBox(height: AppConstants.paddingLarge),

              // ML Forecasting Section
              Text(
                'Prediksi Penjualan (AI)',
                style: TextStyle(
                  fontSize: AppConstants.fontSizeLarge,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textDark,
                ),
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              _ForecastingCard(
                forecasts: _forecasts,
                isLoading: _isLoadingForecast,
                error: _forecastError,
                onRetry: _loadForecasts,
              ),
              const SizedBox(height: AppConstants.paddingLarge),

              // Recent Sales
              Text(
                'Penjualan Terbaru',
                style: TextStyle(
                  fontSize: AppConstants.fontSizeLarge,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textDark,
                ),
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              const _RecentSalesList(),
            ],
          ),
        ),
      ),
    );
  }
}

class _RevenueCard extends StatelessWidget {
  final String title;
  final String amount;
  final IconData icon;
  final Color color;

  const _RevenueCard({
    required this.title,
    required this.amount,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, Color.fromRGBO(color.red, color.green, color.blue, 0.7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white, size: 32),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              amount,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SalesChart extends StatelessWidget {
  final List<FlSpot> salesData;

  const _SalesChart({required this.salesData});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        height: 250,
        child: LineChart(
          LineChartData(
            gridData: const FlGridData(show: true, drawVerticalLine: false),
            titlesData: FlTitlesData(
              leftTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: true, reservedSize: 40),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (value, meta) {
                    final dayIndex = value.toInt();
                    if (dayIndex >= 0 && dayIndex < 7) {
                      final date = now.subtract(Duration(days: 6 - dayIndex));
                      final dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                      return Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          dayNames[date.weekday % 7],
                          style: const TextStyle(fontSize: 10),
                        ),
                      );
                    }
                    return const Text('');
                  },
                ),
              ),
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            lineBarsData: [
              LineChartBarData(
                spots: salesData.isEmpty
                    ? [const FlSpot(0, 0), const FlSpot(6, 0)]
                    : salesData,
                isCurved: true,
                color: AppConstants.primaryBlue,
                barWidth: 3,
                dotData: const FlDotData(show: true),
                belowBarData: BarAreaData(
                  show: true,
                  color: Color.fromRGBO(
                    AppConstants.primaryBlue.red,
                    AppConstants.primaryBlue.green,
                    AppConstants.primaryBlue.blue,
                    0.1,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ForecastingCard extends StatelessWidget {
  final List<Map<String, dynamic>> forecasts;
  final bool isLoading;
  final String? error;
  final VoidCallback onRetry;

  const _ForecastingCard({
    required this.forecasts,
    required this.isLoading,
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final dateFormatter = DateFormat('dd MMM', 'id_ID');

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color.fromRGBO(
                AppConstants.accentBlue.red,
                AppConstants.accentBlue.green,
                AppConstants.accentBlue.blue,
                0.3,
              ),
              Color.fromRGBO(
                AppConstants.lightBlue.red,
                AppConstants.lightBlue.green,
                AppConstants.lightBlue.blue,
                0.3,
              ),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.auto_graph,
                  color: AppConstants.primaryBlue,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Prediksi 3 Hari ke Depan',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppConstants.textDark,
                        ),
                      ),
                      Text(
                        'Powered by LightGBM',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppConstants.textGrey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (error != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha((0.7 * 255).round()),
                  borderRadius: BorderRadius.circular(AppConstants.radiusSmall),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      size: 20,
                      color: AppConstants.primaryBlue,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        error!,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppConstants.textGrey,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: onRetry,
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ),
              )
            else if (forecasts.isNotEmpty)
              Column(
                children: forecasts.map((forecast) {
                  final date = forecast['date'] as DateTime;
                  final quantity = forecast['forecast'] as int;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha((0.8 * 255).round()),
                      borderRadius: BorderRadius.circular(AppConstants.radiusSmall),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.calendar_today,
                              size: 18,
                              color: AppConstants.primaryBlue,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              dateFormatter.format(date),
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            Icon(
                              Icons.trending_up,
                              size: 18,
                              color: AppConstants.successGreen,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '$quantity unit',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppConstants.successGreen,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }).toList(),
              )
            else
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha((0.7 * 255).round()),
                  borderRadius: BorderRadius.circular(AppConstants.radiusSmall),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      size: 20,
                      color: AppConstants.primaryBlue,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Tambahkan data penjualan untuk melihat prediksi',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppConstants.textGrey,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RecentSalesList extends StatelessWidget {
  const _RecentSalesList();

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    final dateFormatter = DateFormat('dd MMM, HH:mm', 'id_ID');

    return Consumer<ProductProvider>(
      builder: (context, provider, _) {
        final recentSales = provider.sales.take(5).toList();

        if (recentSales.isEmpty) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.paddingLarge),
              child: Center(
                child: Text(
                  'Belum ada penjualan',
                  style: TextStyle(color: AppConstants.textGrey),
                ),
              ),
            ),
          );
        }

        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: recentSales.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final sale = recentSales[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Color.fromRGBO(
                    AppConstants.primaryBlue.red,
                    AppConstants.primaryBlue.green,
                    AppConstants.primaryBlue.blue,
                    0.1,
                  ),
                  child: Icon(
                    Icons.shopping_bag,
                    color: AppConstants.primaryBlue,
                  ),
                ),
                title: Text(
                  sale.productName,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  '${sale.quantity}x • ${dateFormatter.format(sale.createdAt)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppConstants.textGrey,
                  ),
                ),
                trailing: Text(
                  formatter.format(sale.totalAmount),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppConstants.successGreen,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
