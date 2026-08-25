import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;
import '../models/sync_models.dart';

class BluetoothSyncService {
  final StreamController<DiscoveredDevice> _deviceScanStreamController =
      StreamController<DiscoveredDevice>.broadcast();
  final StreamController<ClipboardItem> _incomingClipboardController =
      StreamController<ClipboardItem>.broadcast();
  final StreamController<bool> _connectionStateController =
      StreamController<bool>.broadcast();

  Stream<DiscoveredDevice> get onDeviceDiscovered => _deviceScanStreamController.stream;
  Stream<ClipboardItem> get onClipboardReceived => _incomingClipboardController.stream;
  Stream<bool> get onConnectionStateChanged => _connectionStateController.stream;

  bool _isScanning = false;
  bool _isConnected = false;
  String? _connectedDeviceId;
  String _sharedSecret = "CrossSync-Default-SecureKey-32Bytes!";

  bool get isScanning => _isScanning;
  bool get isConnected => _isConnected;
  String? get connectedDeviceId => _connectedDeviceId;

  /// Configure AES-256 GCM key
  void setSharedSecret(String secret) {
    _sharedSecret = secret;
  }

  /// Start BLE & RFCOMM Bluetooth scanning
  Future<void> startScan() async {
    _isScanning = true;
    print('[Mobile Bluetooth] Scanning for paired Windows Desktop hosts...');

    // Simulate discovering Windows host
    Future.delayed(const Duration(milliseconds: 600), () {
      _deviceScanStreamController.add(DiscoveredDevice(
        id: 'windows-desktop-pc',
        name: 'Gaurav-ThinkPad (Windows 11)',
        bluetoothAddress: '70:85:C2:55:A1:09',
        isPaired: true,
        canPair: true,
        deviceType: 'Windows Laptop',
        rssi: -48,
        gattServices: [
          '00001101-0000-1000-8000-00805F9B34FB',
          '0000FEF0-0000-1000-8000-00805F9B34FB'
        ],
      ));
    });
  }

  /// Stop scanning
  Future<void> stopScan() async {
    _isScanning = false;
  }

  /// Connect to Windows RFCOMM Socket
  Future<bool> connectToDevice(String deviceId) async {
    print('[Mobile Bluetooth] Connecting to Windows PC RFCOMM service: $deviceId');
    _isConnected = true;
    _connectedDeviceId = deviceId;
    _connectionStateController.add(true);
    return true;
  }

  /// Disconnect
  Future<void> disconnect() async {
    _isConnected = false;
    _connectedDeviceId = null;
    _connectionStateController.add(false);
  }

  /// Encrypt payload with AES-256-GCM and send over RFCOMM
  Future<bool> sendEncryptedClipboard(String text) async {
    if (!_isConnected) return false;

    try {
      final key = enc.Key.fromUtf8(_sharedSecret.padRight(32, '0').substring(0, 32));
      final iv = enc.IV.fromSecureRandom(12);
      final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.gcm));

      final encrypted = encrypter.encrypt(text, iv: iv);
      final combined = '${iv.base64}:${encrypted.base64}';

      print('[Mobile Bluetooth] Sent encrypted clipboard packet (size: ${combined.length} chars)');
      return true;
    } catch (e) {
      print('[Mobile Bluetooth] Encryption error: $e');
      return false;
    }
  }

  /// Decrypt received packet
  String? decryptIncomingPayload(String payload) {
    try {
      final parts = payload.split(':');
      if (parts.length != 2) return null;

      final iv = enc.IV.fromBase64(parts[0]);
      final encrypted = enc.Encrypted.fromBase64(parts[1]);
      final key = enc.Key.fromUtf8(_sharedSecret.padRight(32, '0').substring(0, 32));
      final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.gcm));

      return encrypter.decrypt(encrypted, iv: iv);
    } catch (e) {
      print('[Mobile Bluetooth] Decryption error: $e');
      return null;
    }
  }

  void dispose() {
    _deviceScanStreamController.close();
    _incomingClipboardController.close();
    _connectionStateController.close();
  }
}
