// SQLite Database Client for Android (sqflite)
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
      CREATE TABLE paired_devices (
        id TEXT PRIMARY KEY,
        device_name TEXT NOT NULL,
        platform TEXT NOT NULL,
        is_online INTEGER NOT NULL DEFAULT 0,
        is_trusted INTEGER NOT NULL DEFAULT 1,
        bluetooth_mac TEXT,
        ip_address TEXT,
        last_seen INTEGER NOT NULL,
        paired_at INTEGER NOT NULL,
        public_key TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE clipboard_history (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        content_type TEXT NOT NULL,
        source_device_id TEXT NOT NULL,
        source_platform TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        content_hash TEXT NOT NULL,
        char_count INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE transfer_history (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        direction TEXT NOT NULL,
        source_device_id TEXT NOT NULL,
        target_device_id TEXT NOT NULL,
        status TEXT NOT NULL,
        progress_percentage REAL NOT NULL,
        speed_bytes_per_sec INTEGER NOT NULL,
        local_path TEXT,
        started_at INTEGER NOT NULL,
        completed_at INTEGER
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
    return result.map((json) => ClipboardItem(
      id: json['id'] as String,
      content: json['content'] as String,
      contentType: json['content_type'] as String,
      sourceDeviceId: json['source_device_id'] as String,
      sourcePlatform: json['source_platform'] as String,
      timestamp: json['timestamp'] as int,
      isPinned: (json['is_pinned'] as int) == 1,
      contentHash: json['content_hash'] as String,
    )).toList();
  }
}
