/**
 * CrossSync Unified Protocol & Cryptographic Types
 * Shared wire contract between Windows (Tauri/Rust) and Android (Flutter/Dart).
 */

export const PROTOCOL_VERSION = '1.0';
export const DEFAULT_RFCOMM_UUID = '7A91D0E0-4E38-40F4-93DC-55734A49B0E1';
export const DEFAULT_WEBSOCKET_PORT = 52849;
export const MAGIC_BYTE = 0x58; // 'X' in ASCII

export enum MessageType {
  DISCOVERY_BEACON = 0x01,
  PAIR_REQUEST = 0x02,
  PAIR_CHALLENGE = 0x03,
  PAIR_CONFIRM = 0x04,
  PAIR_REJECT = 0x05,

  CLIPBOARD_SYNC_EVENT = 0x10,
  CLIPBOARD_ACK = 0x11,

  FILE_TRANSFER_INIT = 0x20,
  FILE_TRANSFER_ACCEPT = 0x21,
  FILE_TRANSFER_REJECT = 0x22,
  FILE_TRANSFER_CHUNK = 0x23,
  FILE_TRANSFER_ACK = 0x24,
  FILE_TRANSFER_COMPLETE = 0x25,
  FILE_TRANSFER_CANCEL = 0x26,

  AUTO_BT_TRIGGER = 0x30,
  HEARTBEAT_PING = 0x31,
  HEARTBEAT_PONG = 0x32,
  DEVICE_DISCONNECT = 0x33,
}

export type PlatformType = 'windows' | 'android' | 'macos' | 'linux' | 'ios';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: PlatformType;
  deviceType: 'laptop' | 'phone' | 'tablet' | 'desktop';
  bluetoothMac?: string;
  ipAddress?: string;
  isOnline: boolean;
  batteryPercentage?: number;
  isBluetoothEnabled: boolean;
  pairedAt: number;
  lastSeen: number;
}

export interface PairRequestPayload {
  protocolVersion: string;
  deviceId: string;
  deviceName: string;
  platform: PlatformType;
  publicKey: string;
  pin: string;
  timestamp: number;
}

export interface PairConfirmPayload {
  deviceId: string;
  deviceName: string;
  platform: PlatformType;
  status: 'PAIRED' | 'REJECTED';
  sessionToken: string;
  capabilities: string[];
}

export interface ClipboardSyncPayload {
  eventId: string;
  sourceDeviceId: string;
  sourcePlatform: PlatformType;
  timestamp: number;
  contentType: 'text/plain' | 'text/html' | 'text/uri-list' | 'image/png';
  payload: string;
  charCount: number;
  sha256: string;
  isEncrypted: boolean;
  thumbnailBase64?: string;
}

export interface FileTransferInitPayload {
  transferId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Checksum: string;
  chunkSizeBytes: number;
  totalChunks: number;
  thumbnailBase64?: string;
  sourceDeviceId: string;
  sourcePlatform: PlatformType;
  targetDeviceId: string;
}

export interface FileTransferChunkPayload {
  transferId: string;
  chunkIndex: number;
  totalChunks: number;
  dataBase64: string;
  offset: number;
  checksum: string;
}

export type QueueItemStatus = 'queued' | 'transferring' | 'paused' | 'completed' | 'cancelled' | 'failed';

export interface TransferQueueItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  direction: 'outgoing' | 'incoming';
  sourcePlatform: 'windows' | 'android';
  targetPlatform: 'windows' | 'android';
  status: QueueItemStatus;
  progressPercentage: number;
  speedBytesPerSec: number;
  startedAt?: number;
  completedAt?: number;
  fileBlobUrl?: string;
  thumbnailBase64?: string;
  sha256Checksum?: string;
}

export interface TransferHistoryItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  direction: 'outgoing' | 'incoming';
  sourceDeviceId: string;
  targetDeviceId: string;
  sourceDeviceName: string;
  targetDeviceName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progressPercentage: number;
  speedBytesPerSec: number;
  localPath?: string;
  thumbnailBase64?: string;
  startedAt: number;
  completedAt?: number;
  sha256Checksum?: string;
  fileBlobUrl?: string;
}

export interface ClipboardItem {
  id: string;
  content: string;
  contentType: 'text/plain' | 'text/html' | 'text/uri-list' | 'image/png';
  sourceDeviceId: string;
  sourceDeviceName: string;
  sourcePlatform: PlatformType;
  timestamp: number;
  isPinned: boolean;
  isFavorite: boolean;
  contentHash: string;
  charCount: number;
  thumbnailData?: string;
}

export interface AppSettings {
  clipboardSyncEnabled: boolean;
  autoBluetoothEnabled: boolean;
  aesEncryptionEnabled: boolean;
  retentionDays: number;
  autoDownloadFilesUnderMb: number;
  bandwidthThrottleKbps: number;
  themeMode: 'dark' | 'light' | 'system';
  soundFeedbackEnabled: boolean;
  autoDisconnectInactivityMins: number;
  activeTransport: 'bluetooth' | 'websocket' | 'auto';
}

/**
 * Lightweight browser-standard SHA-256 calculation using Web Crypto API.
 */
export async function computeSha256(textOrBuffer: string | ArrayBuffer): Promise<string> {
  const data = typeof textOrBuffer === 'string' ? new TextEncoder().encode(textOrBuffer) : textOrBuffer;
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format transfer speed (Bytes/sec -> MB/s or KB/s)
 */
export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec < 1024 * 1024) {
    return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
}
