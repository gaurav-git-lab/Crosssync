class DiscoveredDevice {
  final String id;
  final String name;
  final String bluetoothAddress;
  final bool isPaired;
  final bool canPair;
  final String deviceType;
  final int? rssi;
  final List<String> gattServices;

  DiscoveredDevice({
    required this.id,
    required this.name,
    required this.bluetoothAddress,
    required this.isPaired,
    required this.canPair,
    required this.deviceType,
    this.rssi,
    required this.gattServices,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'bluetooth_address': bluetoothAddress,
      'is_paired': isPaired ? 1 : 0,
      'device_type': deviceType,
      'rssi': rssi,
    };
  }

  factory DiscoveredDevice.fromMap(Map<String, dynamic> map) {
    return DiscoveredDevice(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      bluetoothAddress: map['bluetooth_address'] ?? '',
      isPaired: map['is_paired'] == 1,
      canPair: true,
      deviceType: map['device_type'] ?? 'Unknown',
      rssi: map['rssi'],
      gattServices: const [],
    );
  }
}

class ClipboardItem {
  final String id;
  final String content;
  final String sourceDeviceId;
  final String sourcePlatform;
  final int timestamp;
  final String hash;

  ClipboardItem({
    required this.id,
    required this.content,
    required this.sourceDeviceId,
    required this.sourcePlatform,
    required this.timestamp,
    required this.hash,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'content': content,
      'source_device_id': sourceDeviceId,
      'source_platform': sourcePlatform,
      'timestamp': timestamp,
      'hash': hash,
    };
  }

  factory ClipboardItem.fromMap(Map<String, dynamic> map) {
    return ClipboardItem(
      id: map['id'] ?? '',
      content: map['content'] ?? '',
      sourceDeviceId: map['source_device_id'] ?? '',
      sourcePlatform: map['source_platform'] ?? '',
      timestamp: map['timestamp'] ?? 0,
      hash: map['hash'] ?? '',
    );
  }
}

class FileTransferRecord {
  final String id;
  final String fileName;
  final int fileSize;
  final String senderDeviceId;
  final String receiverDeviceId;
  final String status;
  final String? filePath;
  final int timestamp;

  FileTransferRecord({
    required this.id,
    required this.fileName,
    required this.fileSize,
    required this.senderDeviceId,
    required this.receiverDeviceId,
    required this.status,
    this.filePath,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'file_name': fileName,
      'file_size': fileSize,
      'sender_device_id': senderDeviceId,
      'receiver_device_id': receiverDeviceId,
      'status': status,
      'file_path': filePath,
      'timestamp': timestamp,
    };
  }

  factory FileTransferRecord.fromMap(Map<String, dynamic> map) {
    return FileTransferRecord(
      id: map['id'] ?? '',
      fileName: map['file_name'] ?? '',
      fileSize: map['file_size'] ?? 0,
      senderDeviceId: map['sender_device_id'] ?? '',
      receiverDeviceId: map['receiver_device_id'] ?? '',
      status: map['status'] ?? 'pending',
      filePath: map['file_path'],
      timestamp: map['timestamp'] ?? 0,
    );
  }
}
