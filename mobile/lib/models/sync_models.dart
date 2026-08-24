// Flutter Dart Data Models for CrossSync
import 'dart:convert';
import 'package:crypto/crypto.dart';

enum DevicePlatform { windows, android, macos, linux, ios }
enum TransferDirection { incoming, outgoing }
enum TransferStatus { pending, inProgress, completed, failed, cancelled }

class DeviceInfo {
  final String id;
  final String name;
  final DevicePlatform platform;
  final bool isOnline;
  final bool isBluetoothEnabled;
  final String? ipAddress;
  final String? bluetoothMac;
  final int lastSeen;

  DeviceInfo({
    required this.id,
    required this.name,
    required this.platform,
    this.isOnline = false,
    this.isBluetoothEnabled = true,
    this.ipAddress,
    this.bluetoothMac,
    required this.lastSeen,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'device_name': name,
      'platform': platform.name,
      'is_online': isOnline ? 1 : 0,
      'is_trusted': 1,
      'bluetooth_mac': bluetoothMac,
      'ip_address': ipAddress,
      'last_seen': lastSeen,
      'paired_at': DateTime.now().millisecondsSinceEpoch,
      'public_key': '04_ec_pub_key',
    };
  }

  factory DeviceInfo.fromMap(Map<String, dynamic> map) {
    return DeviceInfo(
      id: map['id'],
      name: map['device_name'],
      platform: DevicePlatform.values.firstWhere(
        (e) => e.name == map['platform'],
        orElse: () => DevicePlatform.windows,
      ),
      isOnline: map['is_online'] == 1,
      ipAddress: map['ip_address'],
      bluetoothMac: map['bluetooth_mac'],
      lastSeen: map['last_seen'] ?? 0,
    );
  }
}

class ClipboardItem {
  final String id;
  final String content;
  final String contentType;
  final String sourceDeviceId;
  final String sourcePlatform;
  final int timestamp;
  final bool isPinned;
  final String contentHash;

  ClipboardItem({
    required this.id,
    required this.content,
    this.contentType = 'text/plain',
    required this.sourceDeviceId,
    required this.sourcePlatform,
    required this.timestamp,
    this.isPinned = false,
    required this.contentHash,
  });

  static String computeHash(String text) {
    return sha256.convert(utf8.encode(text)).toString();
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'content': content,
      'content_type': contentType,
      'source_device_id': sourceDeviceId,
      'source_platform': sourcePlatform,
      'timestamp': timestamp,
      'is_pinned': isPinned ? 1 : 0,
      'content_hash': contentHash,
      'char_count': content.length,
    };
  }
}
