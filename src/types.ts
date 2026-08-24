import { DeviceInfo, ClipboardItem, TransferHistoryItem, AppSettings, PlatformType } from '../shared/protocol';

export type { DeviceInfo, ClipboardItem, TransferHistoryItem, AppSettings, PlatformType };

export type ActiveViewMode = 'dual' | 'windows' | 'android' | 'database' | 'code';

export interface SyncPacketEvent {
  id: string;
  type: 'clipboard' | 'file_init' | 'file_chunk' | 'file_complete' | 'pair' | 'heartbeat';
  source: PlatformType;
  target: PlatformType;
  timestamp: number;
  data: any;
  status: 'transmitting' | 'received' | 'decrypted';
}

export interface SpeedDataPoint {
  time: string;
  speedMBps: number;
}
