import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'models/sync_models.dart';
import 'services/bluetooth_sync_service.dart';
import 'services/clipboard_service.dart';
import 'services/file_service.dart';
import 'database/sqlite_db.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CrossSyncApp());
}

class CrossSyncApp extends StatelessWidget {
  const CrossSyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CrossSync Companion',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primaryColor: const Color(0xFF3B82F6),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF3B82F6),
          surface: Color(0xFF1E293B),
        ),
      ),
      home: const CrossSyncHomePage(),
    );
  }
}

class CrossSyncHomePage extends StatefulWidget {
  const CrossSyncHomePage({super.key});

  @override
  State<CrossSyncHomePage> createState() => _CrossSyncHomePageState();
}

class _CrossSyncHomePageState extends State<CrossSyncHomePage> {
  final BluetoothSyncService _bluetoothService = BluetoothSyncService();
  final ClipboardService _clipboardService = ClipboardService();
  final FileService _fileService = FileService();
  final CrossSyncDatabase _db = CrossSyncDatabase.instance;

  bool _isSyncEnabled = true;
  bool _isConnected = true;
  String _lastSyncedText = "https://github.com/crosssync/protocol-spec";
  List<ClipboardItem> _history = [];
  List<DiscoveredDevice> _devices = [];

  @override
  void initState() {
    super.initState();
    _initServices();
  }

  void _initServices() async {
    _clipboardService.startListening();
    _clipboardService.onClipboardChanged.listen((item) {
      if (_isSyncEnabled) {
        setState(() {
          _lastSyncedText = item.content;
          _history.insert(0, item);
        });
        _db.insertClipboard(item);
        _bluetoothService.sendEncryptedClipboard(item.content);
      }
    });

    _bluetoothService.onDeviceDiscovered.listen((device) {
      setState(() {
        if (!_devices.any((d) => d.id == device.id)) {
          _devices.add(device);
        }
      });
      _db.insertDevice(device);
    });

    final savedHistory = await _db.getRecentClipboard();
    setState(() {
      _history = savedHistory;
    });
  }

  @override
  void dispose() {
    _clipboardService.dispose();
    _bluetoothService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(LucideIcons.repeat, size: 20, color: Colors.white),
            ),
            const SizedBox(width: 12),
            const Text(
              'CrossSync',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isConnected ? LucideIcons.bluetoothConnected : LucideIcons.bluetoothOff,
              color: _isConnected ? const Color(0xFF10B981) : Colors.grey,
            ),
            onPressed: () {
              setState(() {
                _isConnected = !_isConnected;
              });
            },
          ),
          IconButton(
            icon: const Icon(LucideIcons.settings, color: Colors.white70),
            onPressed: () {},
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Connection Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _isConnected ? const Color(0xFF10B981).withOpacity(0.2) : Colors.red.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    LucideIcons.laptop,
                    color: _isConnected ? const Color(0xFF10B981) : Colors.redAccent,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Windows Laptop Link',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isConnected ? 'Connected • AES-256-GCM Secure Channel' : 'Disconnected',
                        style: TextStyle(
                          fontSize: 12,
                          color: _isConnected ? const Color(0xFF34D399) : Colors.white54,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _isSyncEnabled,
                  activeColor: const Color(0xFF3B82F6),
                  onChanged: (val) {
                    setState(() {
                      _isSyncEnabled = val;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Live Synced Clipboard Card
          const Text(
            'ACTIVE CLIPBOARD BUFFER',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white54, letterSpacing: 1.2),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: const [
                        Icon(LucideIcons.clipboardCheck, size: 16, color: Color(0xFF60A5FA)),
                        SizedBox(width: 6),
                        Text(
                          'Windows ⇄ Android in Sync',
                          style: TextStyle(fontSize: 12, color: Color(0xFF60A5FA), fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const Text('Just now', style: TextStyle(fontSize: 11, color: Colors.white38)),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  _lastSyncedText,
                  style: const TextStyle(fontSize: 14, color: Colors.white, fontFamily: 'monospace'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Action Shortcuts
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(LucideIcons.scanLine, size: 18, color: Colors.white),
                  label: const Text('Pair with QR', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  onPressed: () {
                    _bluetoothService.startScan();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF3B82F6)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(LucideIcons.fileUp, size: 18, color: Color(0xFF60A5FA)),
                  label: const Text('Send File', style: TextStyle(color: Color(0xFF60A5FA), fontWeight: FontWeight.bold)),
                  onPressed: () {},
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
