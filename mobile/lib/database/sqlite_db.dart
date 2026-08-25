import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/sync_models.dart';

class CrossSyncDatabase {
  static final CrossSyncDatabase instance = CrossSyncDatabase._init();
  static Database? _database;

  CrossSyncDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('crosssync_mobile.db');
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
    await db.execute('''
      CREATE TABLE clipboard_history (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        source_device_id TEXT NOT NULL,
        source_platform TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        hash TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE paired_devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        bluetooth_address TEXT NOT NULL,
        is_paired INTEGER NOT NULL,
        device_type TEXT NOT NULL,
        rssi INTEGER
      )
    ''');

    await db.execute('''
      CREATE TABLE file_transfers (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        sender_device_id TEXT NOT NULL,
        receiver_device_id TEXT NOT NULL,
        status TEXT NOT NULL,
        file_path TEXT,
        timestamp INTEGER NOT NULL
      )
    ''');
  }

  Future<int> insertClipboard(ClipboardItem item) async {
    final db = await instance.database;
    return await db.insert(
      'clipboard_history',
      item.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<ClipboardItem>> getRecentClipboard({int limit = 50}) async {
    final db = await instance.database;
    final result = await db.query(
      'clipboard_history',
      orderBy: 'timestamp DESC',
      limit: limit,
    );
    return result.map((json) => ClipboardItem.fromMap(json)).toList();
  }

  Future<int> insertDevice(DiscoveredDevice device) async {
    final db = await instance.database;
    return await db.insert(
      'paired_devices',
      device.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<DiscoveredDevice>> getPairedDevices() async {
    final db = await instance.database;
    final result = await db.query('paired_devices', where: 'is_paired = ?', whereArgs: [1]);
    return result.map((json) => DiscoveredDevice.fromMap(json)).toList();
  }

  Future<int> insertTransfer(FileTransferRecord record) async {
    final db = await instance.database;
    return await db.insert(
      'file_transfers',
      record.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<FileTransferRecord>> getTransferHistory({int limit = 50}) async {
    final db = await instance.database;
    final result = await db.query('file_transfers', orderBy: 'timestamp DESC', limit: limit);
    return result.map((json) => FileTransferRecord.fromMap(json)).toList();
  }

  Future close() async {
    final db = await instance.database;
    db.close();
  }
}
