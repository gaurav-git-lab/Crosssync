// Android Clipboard Monitoring and Deduplication Service
import 'dart:async';
import 'package:flutter/services.dart';
import '../models/sync_models.dart';

typedef OnClipboardChangedCallback = void Function(ClipboardItem item);

class ClipboardService {
  static final ClipboardService _instance = ClipboardService._internal();
  factory ClipboardService() => _instance;
  ClipboardService._internal();

  final List<String> _recentRemoteHashes = [];
  OnClipboardChangedCallback? onRemoteSyncNeeded;
  String? _lastLocalHash;
  bool _isListening = false;

  void startListening(OnClipboardChangedCallback callback) {
    if (_isListening) return;
    _isListening = true;
    onRemoteSyncNeeded = callback;
    // Check clipboard periodically when foregrounded or hooked into native broadcast receiver
    Timer.periodic(const Duration(milliseconds: 600), (timer) async {
      final data = await Clipboard.getData(Clipboard.kTextPlain);
      if (data?.text != null && data!.text!.isNotEmpty) {
        _handleLocalClipboardChange(data.text!);
      }
    });
  }

  void _handleLocalClipboardChange(String text) {
    final hash = ClipboardItem.computeHash(text);
    if (hash == _lastLocalHash) return;
    _lastLocalHash = hash;

    // Deduplicate against remote echoes
    if (_recentRemoteHashes.contains(hash)) {
      return;
    }

    final item = ClipboardItem(
      id: 'clip_${DateTime.now().millisecondsSinceEpoch}',
      content: text,
      sourceDeviceId: 'android-local',
      sourcePlatform: 'android',
      timestamp: DateTime.now().millisecondsSinceEpoch,
      contentHash: hash,
    );

    onRemoteSyncNeeded?.call(item);
  }

  /// Called when a clipboard event is received from Windows desktop
  Future<void> applyRemoteClipboard(ClipboardItem item) async {
    _recentRemoteHashes.add(item.contentHash);
    if (_recentRemoteHashes.length > 25) {
      _recentRemoteHashes.removeAt(0);
    }
    _lastLocalHash = item.contentHash;
    await Clipboard.setData(ClipboardData(text: item.content));
  }
}
