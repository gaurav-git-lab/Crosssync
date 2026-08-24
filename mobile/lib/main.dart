import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'models/sync_models.dart';
import 'services/bluetooth_sync_service.dart';
import 'services/clipboard_service.dart';
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
      title: 'CrossSync',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0D1117),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E5FF),
          secondary: Color(0xFF7C4DFF),
          surface: Color(0xFF161B22),
        ),
      ),
      home: const MobileHomeScreen(),
    );
  }
}

class MobileHomeScreen extends StatefulWidget {
  const MobileHomeScreen({super.key});

  @override
  State<MobileHomeScreen> createState() => _MobileHomeScreenState();
}

class _MobileHomeScreenState extends State<MobileHomeScreen> {
  final BluetoothSyncService _btService = BluetoothSyncService();
  final ClipboardService _clipboardService = ClipboardService();
  List<ClipboardItem> _clipboardHistory = [];
  bool _isAutoBtEnabled = true;

  @override
  void initState() {
    super.initState();
    _initServices();
  }

  void _initServices() {
    _clipboardService.startListening((item) {
      _btService.sendClipboard(item);
      CrossSyncDatabase.instance.insertClipboard(item);
      _loadHistory();
    });
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final list = await CrossSyncDatabase.instance.getRecentClipboard();
    setState(() {
      _clipboardHistory = list;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF00E5FF).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.sync_alt, color: Color(0xFF00E5FF), size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'CrossSync',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              _btService.isBluetoothActive ? Icons.bluetooth : Icons.bluetooth_disabled,
              color: _btService.isBluetoothActive ? const Color(0xFF00E5FF) : Colors.grey,
            ),
            onPressed: () {
              setState(() {
                _btService.isBluetoothActive = !_btService.isBluetoothActive;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {},
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.pad(BorderSide(color: Colors.white.withOpacity(0.1))),
              ),
              child: Row(
                children: [
                  const Icon(Icons.laptop_chromebook, color: Color(0xFF00E5FF), size: 32),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          "Gaurav's ThinkPad X1",
                          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                        ),
                        SizedBox(height: 4),
                        Text(
                          "Connected • AES-256 Encrypted",
                          style: TextStyle(color: Colors.greenAccent, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Recent Synced Items',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: _clipboardHistory.length,
                itemBuilder: (context, index) {
                  final item = _clipboardHistory[index];
                  return Card(
                    color: Colors.white.withOpacity(0.04),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ListTile(
                      title: Text(
                        item.content,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14),
                      ),
                      subtitle: Text(
                        '${item.sourcePlatform} • just now',
                        style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11),
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.copy, size: 18),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: item.content));
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
