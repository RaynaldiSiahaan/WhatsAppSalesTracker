import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/product_provider.dart';
import '../services/ml_service.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  final MLService _mlService = MLService();

  // API Stats
  DashboardStats? _apiStats;
  bool _isLoading = false;
  String? _errorMessage;

  // Local sales data for charts and forecasting
  List<FlSpot> _salesData = [];
  String? _selectedProductId;
  bool _salesDataLoading = false;

  // Date range for filtering
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    // Set default date range to current week
    final now = DateTime.now();
    _startDate = now.subtract(Duration(days: now.weekday - 1));
    _endDate = now;
    _loadAllData();
  }

  @override
  void dispose() {
    _mlService.dispose();
    super.dispose();
  }

  Future<void> _loadAllData() async {
    setState(() => _isLoading = true);

    await Future.wait([
      _loadDashboardStats(),
      _loadSalesChart(),
    ]);

    setState(() => _isLoading = false);
  }

  Future<void> _loadDashboardStats() async {
    setState(() => _errorMessage = null);

    try {
      final provider = Provider.of<ProductProvider>(context, listen: false);

      final stats = await _apiService.getDashboardStats(
        storeId: provider.storeId,
        startDate: _startDate,
        endDate: _endDate,
      );

      if (mounted) {
        setState(() => _apiStats = stats);
      }
    } catch (e) {
      print('Error loading dashboard stats: $e');
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    }
  }

  Future<void> _loadSalesChart() async {
    setState(() => _salesDataLoading = true);

    try {
      final provider = Provider.of<ProductProvider>(context, listen: false);

      // Load sales from local database
      final now = DateTime.now();
      final weekAgo = now.subtract(const Duration(days: 7));
      await provider.loadSales(startDate: weekAgo, endDate: now);

      // Filter by product if selected
      final sales = _selectedProductId == null
          ? provider.sales
          : provider.sales
              .where((s) => s.productId == _selectedProductId)
              .toList();

      // Group by day
      Map<int, double> dailyTotals = {};
      for (final sale in sales) {
        final dayIndex = sale.createdAt.difference(weekAgo).inDays;
        if (dayIndex >= 0 && dayIndex < 7) {
          dailyTotals[dayIndex] = (dailyTotals[dayIndex] ?? 0) + sale.quantity;
        }
      }

      if (mounted) {
        setState(() {
          _salesData = List.generate(7, (i) {
            return FlSpot(i.toDouble(), dailyTotals[i] ?? 0);
          });
          _salesDataLoading = false;
        });
      }
    } catch (e) {
      print('Error loading sales chart: $e');
      if (mounted) {
        setState(() {
          _salesData = List.generate(7, (i) => FlSpot(i.toDouble(), 0));
          _salesDataLoading = false;
        });
      }
    }
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(
        start: _startDate ?? DateTime.now().subtract(const Duration(days: 7)),
        end: _endDate ?? DateTime.now(),
      ),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppConstants.primaryBlue,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
      _loadAllData();
    }
  }

  Widget _buildWelcomeHeader() {
    final hour = DateTime.now().hour;
    String greeting = 'Selamat Pagi';
    IconData greetingIcon = Icons.wb_sunny_outlined;

    if (hour >= 12 && hour < 15) {
      greeting = 'Selamat Siang';
      greetingIcon = Icons.wb_sunny;
    } else if (hour >= 15 && hour < 18) {
      greeting = 'Selamat Sore';
      greetingIcon = Icons.wb_twilight;
    } else if (hour >= 18 || hour < 4) {
      greeting = 'Selamat Malam';
      greetingIcon = Icons.nights_stay_outlined;
    }

    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppConstants.primaryBlue, AppConstants.lightBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        boxShadow: [
          BoxShadow(
            color: AppConstants.primaryBlue.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(greetingIcon, color: Colors.white, size: 32),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  greeting,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Mari lihat performa bisnis Anda!',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadAllData,
            tooltip: 'Refresh Data',
          ),
        ],
      ),
    );
  }

  Widget _buildDateRangeSelector() {
    final dateFormatter = DateFormat('dd MMM yyyy', 'id_ID');

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
      ),
      child: InkWell(
        onTap: _selectDateRange,
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.paddingMedium),
          child: Row(
            children: [
              Icon(Icons.date_range, color: AppConstants.primaryBlue),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Periode Data',
                      style:
                          TextStyle(fontSize: 12, color: AppConstants.textGrey),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _startDate != null && _endDate != null
                          ? '${dateFormatter.format(_startDate!)} - ${dateFormatter.format(_endDate!)}'
                          : 'Pilih rentang tanggal',
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: AppConstants.textGrey),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsCards(NumberFormat formatter) {
    if (_isLoading && _apiStats == null) {
      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        ),
        child: Container(
          height: 200,
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Memuat data statistik...'),
              ],
            ),
          ),
        ),
      );
    }

    if (_apiStats == null) return const SizedBox.shrink();

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppConstants.primaryBlue.withOpacity(0.05),
              AppConstants.lightBlue.withOpacity(0.05),
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
                Icon(Icons.analytics,
                    color: AppConstants.primaryBlue, size: 24),
                const SizedBox(width: 8),
                Text(
                  'Statistik Bisnis',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.primaryBlue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    icon: Icons.store,
                    label: 'Total Toko',
                    value: _apiStats!.totalStores.toString(),
                    color: AppConstants.primaryBlue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: Icons.inventory_2,
                    label: 'Total Produk',
                    value: _apiStats!.totalProducts.toString(),
                    color: AppConstants.accentBlue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    icon: Icons.receipt_long,
                    label: 'Total Pesanan',
                    value: _apiStats!.totalOrdersReceived.toString(),
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: Icons.payments,
                    label: 'Total Revenue',
                    value: formatter.format(_apiStats!.totalRevenue),
                    color: AppConstants.successGreen,
                    isRevenue: true,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
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
        title: const Text('Dashboard',
            style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppConstants.primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      body: RefreshIndicator(
        onRefresh: _loadAllData,
        color: AppConstants.primaryBlue,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppConstants.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              _buildWelcomeHeader(),
              const SizedBox(height: AppConstants.paddingMedium),

              // Date Range Selector
              _buildDateRangeSelector(),
              const SizedBox(height: AppConstants.paddingMedium),

              // Stats Cards from API
              _buildStatsCards(formatter),
              const SizedBox(height: AppConstants.paddingMedium),

              // Product Filter
              Consumer<ProductProvider>(
                builder: (context, provider, _) {
                  return Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(AppConstants.radiusMedium),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.paddingMedium),
                      child: DropdownButtonFormField<String?>(
                        decoration: InputDecoration(
                          labelText: 'Filter Produk',
                          border: OutlineInputBorder(
                            borderRadius:
                                BorderRadius.circular(AppConstants.radiusSmall),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
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
                              child: Text(
                                product.name,
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }),
                        ],
                        onChanged: (value) {
                          setState(() => _selectedProductId = value);
                          _loadSalesChart();
                        },
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: AppConstants.paddingLarge),

              // Sales Chart
              Row(
                children: [
                  Icon(Icons.show_chart,
                      color: AppConstants.primaryBlue, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    'Grafik Penjualan (7 Hari)',
                    style: TextStyle(
                      fontSize: AppConstants.fontSizeLarge,
                      fontWeight: FontWeight.bold,
                      color: AppConstants.textDark,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              _SalesChart(salesData: _salesData, isLoading: _salesDataLoading),
              const SizedBox(height: AppConstants.paddingLarge),

              // ML Forecasting
              Row(
                children: [
                  Icon(Icons.auto_graph,
                      color: AppConstants.primaryBlue, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    'Prediksi Penjualan (AI)',
                    style: TextStyle(
                      fontSize: AppConstants.fontSizeLarge,
                      fontWeight: FontWeight.bold,
                      color: AppConstants.textDark,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              _ForecastingCard(
                mlService: _mlService,
                selectedProductId: _selectedProductId,
              ),
              const SizedBox(height: AppConstants.paddingLarge),

              // Recent Sales
              Row(
                children: [
                  Icon(Icons.history,
                      color: AppConstants.primaryBlue, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    'Penjualan Terbaru',
                    style: TextStyle(
                      fontSize: AppConstants.fontSizeLarge,
                      fontWeight: FontWeight.bold,
                      color: AppConstants.textDark,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              const _RecentSalesList(),
              const SizedBox(height: AppConstants.paddingMedium),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final bool isRevenue;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.isRevenue = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        border: Border.all(color: color.withOpacity(0.3), width: 2),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: isRevenue ? 14 : 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textAlign: TextAlign.center,
            maxLines: isRevenue ? 2 : 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: AppConstants.textGrey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _SalesChart extends StatelessWidget {
  final List<FlSpot> salesData;
  final bool isLoading;

  const _SalesChart({required this.salesData, this.isLoading = false});

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        ),
        child: Container(
          height: 220,
          child: const Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final now = DateTime.now();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        height: 220,
        child: LineChart(
          LineChartData(
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: 1,
              getDrawingHorizontalLine: (value) {
                return FlLine(
                  color: Colors.grey.withOpacity(0.2),
                  strokeWidth: 1,
                );
              },
            ),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 35,
                  getTitlesWidget: (value, meta) {
                    return Text(
                      value.toInt().toString(),
                      style: TextStyle(
                        color: AppConstants.textGrey,
                        fontSize: 10,
                      ),
                    );
                  },
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 30,
                  getTitlesWidget: (value, meta) {
                    final dayIndex = value.toInt();
                    final date = now.subtract(Duration(days: 6 - dayIndex));
                    final dayName = _getDayName(date.weekday);
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        dayName,
                        style: TextStyle(
                          color: AppConstants.textGrey,
                          fontSize: 10,
                        ),
                      ),
                    );
                  },
                ),
              ),
              rightTitles:
                  AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            lineBarsData: [
              LineChartBarData(
                spots: salesData.isEmpty
                    ? [const FlSpot(0, 0), const FlSpot(6, 0)]
                    : salesData,
                isCurved: true,
                curveSmoothness: 0.3,
                color: AppConstants.primaryBlue,
                barWidth: 3,
                isStrokeCapRound: true,
                dotData: FlDotData(
                  show: true,
                  getDotPainter: (spot, percent, barData, index) {
                    return FlDotCirclePainter(
                      radius: 4,
                      color: Colors.white,
                      strokeWidth: 2,
                      strokeColor: AppConstants.primaryBlue,
                    );
                  },
                ),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    colors: [
                      AppConstants.primaryBlue.withOpacity(0.3),
                      AppConstants.primaryBlue.withOpacity(0.0),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ],
            lineTouchData: LineTouchData(
              touchTooltipData: LineTouchTooltipData(
                getTooltipItems: (touchedSpots) {
                  return touchedSpots.map((spot) {
                    return LineTooltipItem(
                      '${spot.y.toInt()} unit',
                      const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    );
                  }).toList();
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _getDayName(int weekday) {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return days[weekday - 1];
  }
}

class _ForecastingCard extends StatefulWidget {
  final MLService mlService;
  final String? selectedProductId;

  const _ForecastingCard({
    required this.mlService,
    this.selectedProductId,
  });

  @override
  State<_ForecastingCard> createState() => _ForecastingCardState();
}

class _ForecastingCardState extends State<_ForecastingCard> {
  List<Map<String, dynamic>>? _forecasts;
  bool _isLoading = false;
  String? _error;
  bool _hasEnoughData = false;

  @override
  void initState() {
    super.initState();
    _loadForecast();
  }

  @override
  void didUpdateWidget(covariant _ForecastingCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedProductId != widget.selectedProductId) {
      _loadForecast();
    }
  }

  Future<void> _loadForecast() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _forecasts = null;
    });

    try {
      final provider = Provider.of<ProductProvider>(context, listen: false);

      // Load historical sales (last 14 days)
      final now = DateTime.now();
      final startDate = now.subtract(const Duration(days: 14));
      await provider.loadSales(startDate: startDate, endDate: now);

      // Filter by product if selected
      final sales = widget.selectedProductId == null
          ? provider.sales
          : provider.sales
              .where((s) => s.productId == widget.selectedProductId)
              .toList();

      // Check if we have enough data
      if (sales.length < 7) {
        setState(() {
          _hasEnoughData = false;
          _isLoading = false;
        });
        return;
      }

      _hasEnoughData = true;

      // Forecast (initialization handled internally with fallback)
      final forecasts = await widget.mlService.forecast(
        outletId: 1,
        productId: widget.selectedProductId != null
            ? int.tryParse(widget.selectedProductId!) ?? 1
            : 1,
        historicalSales: sales,
        days: 3,
      );

      if (mounted) {
        setState(() {
          _forecasts = forecasts;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error forecasting: $e');
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    final dateFormatter = DateFormat('EEE, d MMM', 'id_ID');

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
              AppConstants.accentBlue.withOpacity(0.15),
              AppConstants.lightBlue.withOpacity(0.15),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppConstants.primaryBlue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.psychology,
                    color: AppConstants.primaryBlue,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Prediksi AI',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        widget.mlService.isUsingFallback
                            ? 'Statistical AI (Trend + Seasonality)'
                            : 'Model LightGBM (TensorFlow Lite)',
                        style: TextStyle(
                            fontSize: 12, color: AppConstants.textGrey),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.refresh, color: AppConstants.primaryBlue),
                  onPressed: _isLoading ? null : _loadForecast,
                  tooltip: 'Refresh Prediksi',
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Content
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Column(
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 12),
                      Text('Menganalisis data penjualan...'),
                    ],
                  ),
                ),
              )
            else if (!_hasEnoughData)
              _buildInfoCard(
                icon: Icons.info_outline,
                color: Colors.orange,
                title: 'Data Belum Cukup',
                message:
                    'Minimal 7 transaksi diperlukan untuk prediksi. Terus jual produk Anda!',
              )
            else if (_error != null)
              _buildInfoCard(
                icon: Icons.warning_amber_outlined,
                color: AppConstants.errorRed,
                title: 'Gagal Memuat Prediksi',
                message: _error!.contains('platform')
                    ? 'Model AI tidak kompatibel dengan platform ini.'
                    : _error!.contains('historical data')
                        ? 'Butuh minimal 7 transaksi untuk prediksi.'
                        : 'Coba refresh atau periksa model AI.',
              )
            else if (_forecasts != null && _forecasts!.isNotEmpty)
              Column(
                children: List.generate(_forecasts!.length, (index) {
                  final forecast = _forecasts![index];
                  final date = forecast['date'] as DateTime;
                  final quantity = forecast['forecast'] as int;

                  // Get average price for revenue estimation
                  final provider =
                      Provider.of<ProductProvider>(context, listen: false);
                  final avgPrice = provider.products.isNotEmpty
                      ? provider.products
                              .map((p) => p.price)
                              .reduce((a, b) => a + b) /
                          provider.products.length
                      : 0.0;
                  final estimatedRevenue = quantity * avgPrice;

                  return Container(
                    margin: EdgeInsets.only(
                        bottom: index < _forecasts!.length - 1 ? 8 : 0),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius:
                          BorderRadius.circular(AppConstants.radiusSmall),
                      border: Border.all(
                        color: index == 0
                            ? AppConstants.primaryBlue.withOpacity(0.3)
                            : Colors.grey.withOpacity(0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        // Date
                        Container(
                          width: 60,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                index == 0
                                    ? 'Besok'
                                    : index == 1
                                        ? 'Lusa'
                                        : '+3 Hari',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppConstants.textGrey,
                                ),
                              ),
                              Text(
                                dateFormatter.format(date),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Quantity
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.shopping_bag_outlined,
                                    size: 16,
                                    color: AppConstants.primaryBlue,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '$quantity unit',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: AppConstants.primaryBlue,
                                    ),
                                  ),
                                ],
                              ),
                              if (avgPrice > 0)
                                Text(
                                  '~ ${formatter.format(estimatedRevenue)}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppConstants.successGreen,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        // Trend indicator
                        Icon(
                          quantity > 0
                              ? Icons.trending_up
                              : Icons.trending_flat,
                          color: quantity > 0
                              ? AppConstants.successGreen
                              : Colors.grey,
                          size: 20,
                        ),
                      ],
                    ),
                  );
                }),
              )
            else
              _buildInfoCard(
                icon: Icons.auto_graph,
                color: AppConstants.primaryBlue,
                title: 'Siap Prediksi',
                message:
                    'Tekan tombol refresh untuk memuat prediksi penjualan.',
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required Color color,
    required String title,
    required String message,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppConstants.radiusSmall),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontWeight: FontWeight.bold, color: color),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: TextStyle(fontSize: 12, color: AppConstants.textGrey),
                ),
              ],
            ),
          ),
        ],
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
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.paddingLarge),
              child: Column(
                children: [
                  Icon(
                    Icons.receipt_long_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Belum ada penjualan',
                    style:
                        TextStyle(color: AppConstants.textGrey, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Data penjualan lokal akan muncul di sini',
                    style: TextStyle(color: Colors.grey[400], fontSize: 12),
                  ),
                ],
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
            separatorBuilder: (context, index) =>
                Divider(height: 1, color: Colors.grey[200]),
            itemBuilder: (context, index) {
              final sale = recentSales[index];
              return ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                leading: CircleAvatar(
                  backgroundColor: AppConstants.primaryBlue.withOpacity(0.1),
                  child: Icon(
                    Icons.shopping_bag,
                    color: AppConstants.primaryBlue,
                    size: 20,
                  ),
                ),
                title: Text(
                  sale.productName,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  '${sale.quantity}x • ${dateFormatter.format(sale.createdAt)}',
                  style: TextStyle(fontSize: 12, color: AppConstants.textGrey),
                ),
                trailing: Text(
                  formatter.format(sale.totalAmount),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppConstants.successGreen,
                    fontSize: 14,
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
