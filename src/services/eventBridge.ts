import { invoke } from '@tauri-apps/api/core';

export interface NativeDeviceInfo {
  id: string;
  name: string;
  platform: string;
  bluetooth_address?: string;
  is_online: boolean;
  is_bluetooth_enabled: boolean;
  ip_address?: string;
}

export interface NativeClipboardRecord {
  id: string;
  content: string;
  source_device_id: string;
  source_platform: string;
  timestamp: number;
  hash: string;
}

export interface NativeFileMeta {
  transfer_id: string;
  file_name: string;
  file_size: number;
  total_chunks: number;
  chunk_size: number;
  file_hash_sha256: string;
  mime_type: string;
}

// Check if running inside actual native Tauri runtime
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const eventBridge = {
  /**
   * Scan for Bluetooth & BLE devices
   */
  scanBluetoothDevices: async (): Promise<NativeDeviceInfo[]> => {
    if (isTauriEnvironment()) {
      try {
        return await invoke<NativeDeviceInfo[]>('scan_bluetooth_devices');
      } catch (err) {
        console.warn('[Native Bridge] Tauri scan fallback:', err);
      }
    }
    return [
      {
        id: 'android-pixel-7a',
        name: "Gaurav's Pixel 7",
        platform: 'android',
        bluetooth_address: 'A4:C3:F0:89:12:34',
        is_online: true,
        is_bluetooth_enabled: true,
        ip_address: '192.168.1.105',
      },
    ];
  },

  /**
   * Sync clipboard text across devices
   */
  sendClipboard: async (content: string): Promise<string> => {
    if (isTauriEnvironment()) {
      try {
        return await invoke<string>('send_clipboard_event', { content });
      } catch (err) {
        console.warn('[Native Bridge] Tauri send clipboard fallback:', err);
      }
    }
    return `Synced at ${Date.now()}`;
  },

  /**
   * Write directly to native OS clipboard
   */
  setSystemClipboard: async (content: string): Promise<boolean> => {
    if (isTauriEnvironment()) {
      try {
        return await invoke<boolean>('set_system_clipboard', { content });
      } catch (err) {
        console.warn('[Native Bridge] Tauri set clipboard fallback:', err);
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(content);
      return true;
    }
    return false;
  },

  /**
   * Toggle auto-Bluetooth state on Windows
   */
  triggerAutoBluetooth: async (enable: boolean): Promise<boolean> => {
    if (isTauriEnvironment()) {
      try {
        return await invoke<boolean>('trigger_auto_bluetooth', { enable });
      } catch (err) {
        console.warn('[Native Bridge] Tauri auto Bluetooth fallback:', err);
      }
    }
    return enable;
  },

  /**
   * Prepare native file transfer
   */
  prepareFileTransfer: async (filePath: string): Promise<NativeFileMeta | null> => {
    if (isTauriEnvironment()) {
      try {
        return await invoke<NativeFileMeta>('prepare_file_transfer', { filePath });
      } catch (err) {
        console.warn('[Native Bridge] Tauri prepare file transfer error:', err);
      }
    }
    return null;
  },
};
