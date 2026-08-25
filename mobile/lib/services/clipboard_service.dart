import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/services.dart';
import '../models/sync_models.dart';

class ClipboardService {
  final StreamController<ClipboardItem> _clipboardStreamController =
      StreamController<ClipboardItem>.broadcast();

  Stream<ClipboardItem> get onClipboardChanged => _clipboardStreamController.stream;

  String _lastHash = '';
  final List<String> _recentHashes = [];
  Timer? _pollingTimer;

  static String computeHash(String text) {
    return sha256.convert(utf8.encode(text)).toString();
  }

  /// Start clipboard polling listener on Android
  void startListening({Duration interval = const Duration(milliseconds: 300)}) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(interval, (_) async {
      final ClipboardData? data = await Clipboard.getData(Clipboard.kTextPlain);
      if (data != null && data.text != null && data.text!.isNotEmpty) {
        final String text = data.text!;
        final String hash = computeHash(text);

        if (hash != _lastHash && !_recentHashes.contains(hash)) {
          _lastHash = hash;
          _recentHashes.add(hash);
          if (_recentHashes.length > 50) {
            _recentHashes.removeAt(0);
          }

          final item = ClipboardItem(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            content: text,
            sourceDeviceId: 'android-phone',
            sourcePlatform: 'android',
            timestamp: DateTime.now().millisecondsSinceEpoch,
            hash: hash,
          );

          _clipboardStreamController.add(item);
        }
      }
    });
  }

  /// Set device clipboard text (with hash tracking to avoid loopback)
  Future<void> setClipboard(String text) async {
    final hash = computeHash(text);
    _lastHash = hash;
    _recentHashes.add(hash);
    if (_recentHashes.length > 50) {
      _recentHashes.removeAt(0);
    }

    await Clipboard.setData(ClipboardData(text: text));
  }

  void stopListening() {
    _pollingTimer?.cancel();
  }

  void dispose() {
    _pollingTimer?.cancel();
    _clipboardStreamController.close();
  }
}
