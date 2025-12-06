import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/product.dart';
import '../models/sale.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('umkm_seller.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    const idType = 'TEXT PRIMARY KEY';
    const textType = 'TEXT NOT NULL';
    const intType = 'INTEGER NOT NULL';
    const realType = 'REAL NOT NULL';

    // Products table
    await db.execute('''
      CREATE TABLE products (
        id $idType,
        store_id $textType,
        name $textType,
        price $realType,
        stock_quantity $intType,
        image_url TEXT,
        image_path TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
      )
    ''');

    // Sales table
    await db.execute('''
      CREATE TABLE sales (
        id $idType,
        store_id $textType,
        product_id $textType,
        product_name $textType,
        quantity $intType,
        price_at_sale $realType,
        total_amount $realType,
        created_at $textType
      )
    ''');
  }

  // ========== PRODUCTS ==========
  
  Future<String> insertProduct(Product product) async {
    final db = await database;
    final id = product.id ?? DateTime.now().millisecondsSinceEpoch.toString();
    final productWithId = product.copyWith(id: id);
    await db.insert('products', productWithId.toMap());
    return id;
  }

  Future<List<Product>> getProducts(String storeId) async {
    final db = await database;
    final result = await db.query(
      'products',
      where: 'store_id = ? AND is_active = 1',
      whereArgs: [storeId],
      orderBy: 'created_at DESC',
    );
    return result.map((json) => Product.fromMap(json)).toList();
  }

  Future<Product?> getProduct(String id) async {
    final db = await database;
    final result = await db.query(
      'products',
      where: 'id = ?',
      whereArgs: [id],
    );
    if (result.isNotEmpty) {
      return Product.fromMap(result.first);
    }
    return null;
  }

  Future<int> updateProduct(Product product) async {
    final db = await database;
    return db.update(
      'products',
      product.toMap(),
      where: 'id = ?',
      whereArgs: [product.id],
    );
  }

  Future<int> deleteProduct(String id) async {
    final db = await database;
    return db.update(
      'products',
      {'is_active': 0},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> updateProductStock(String id, int newStock) async {
    final db = await database;
    return db.update(
      'products',
      {
        'stock_quantity': newStock,
        'updated_at': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // ========== SALES ==========
  
  Future<String> insertSale(Sale sale) async {
    final db = await database;
    final id = sale.id ?? DateTime.now().millisecondsSinceEpoch.toString();
    final saleWithId = Sale(
      id: id,
      storeId: sale.storeId,
      productId: sale.productId,
      productName: sale.productName,
      quantity: sale.quantity,
      priceAtSale: sale.priceAtSale,
      totalAmount: sale.totalAmount,
      createdAt: sale.createdAt,
    );
    await db.insert('sales', saleWithId.toMap());
    return id;
  }

  Future<List<Sale>> getSales(String storeId, {DateTime? startDate, DateTime? endDate}) async {
    final db = await database;
    
    String whereClause = 'store_id = ?';
    List<dynamic> whereArgs = [storeId];
    
    if (startDate != null) {
      whereClause += ' AND created_at >= ?';
      whereArgs.add(startDate.toIso8601String());
    }
    
    if (endDate != null) {
      whereClause += ' AND created_at <= ?';
      whereArgs.add(endDate.toIso8601String());
    }
    
    final result = await db.query(
      'sales',
      where: whereClause,
      whereArgs: whereArgs,
      orderBy: 'created_at DESC',
    );
    
    return result.map((json) => Sale.fromMap(json)).toList();
  }

  Future<double> getTotalRevenue(String storeId, {DateTime? startDate, DateTime? endDate}) async {
    final sales = await getSales(storeId, startDate: startDate, endDate: endDate);
    return sales.fold<double>(0.0, (sum, sale) => sum + sale.totalAmount);
  }

  // Clear all data (for logout)
  Future<void> clearAllData() async {
    final db = await database;
    await db.delete('products');
    await db.delete('sales');
  }

  Future close() async {
    final db = await database;
    db.close();
  }
}
