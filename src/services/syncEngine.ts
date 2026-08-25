import { DeviceInfo, ClipboardItem, TransferHistoryItem, TransferQueueItem, QueueItemStatus, AppSettings, computeSha256, formatBytes } from '../../shared/protocol';
import { SyncPacketEvent, SpeedDataPoint } from '../types';
import { sounds } from './soundEffects';
import confetti from 'canvas-confetti';

type Listener<T> = (data: T) => void;

class SyncEngine {
  private broadcastChannel: BroadcastChannel | null = null;
  private recentHashes: Set<string> = new Set();
  private queueIntervals: Map<string, any> = new Map();
  
  public settings: AppSettings = {
    clipboardSyncEnabled: true,
    autoBluetoothEnabled: true,
    aesEncryptionEnabled: true,
    retentionDays: 30,
    autoDownloadFilesUnderMb: 25,
    bandwidthThrottleKbps: 0,
    themeMode: 'dark',
    soundFeedbackEnabled: true,
    autoDisconnectInactivityMins: 60,
    activeTransport: 'bluetooth',
  };

  public windowsDevice: DeviceInfo = {
    id: 'win-laptop-x1',
    name: "Gaurav's ThinkPad X1",
    platform: 'windows',
    deviceType: 'laptop',
    bluetoothMac: '84:A6:C8:1F:33:9A',
    ipAddress: '192.168.1.102',
    isOnline: true,
    isBluetoothEnabled: true,
    batteryPercentage: 92,
    pairedAt: Date.now() - 86400000 * 2,
    lastSeen: Date.now(),
  };

  public androidDevice: DeviceInfo = {
    id: 'android-pixel-7',
    name: "Gaurav's Pixel 7",
    platform: 'android',
    deviceType: 'phone',
    bluetoothMac: 'FC:E8:92:4B:11:77',
    ipAddress: '192.168.1.105',
    isOnline: true,
    isBluetoothEnabled: true,
    batteryPercentage: 78,
    pairedAt: Date.now() - 86400000 * 2,
    lastSeen: Date.now(),
  };

  public clipboardHistory: ClipboardItem[] = [
    {
      id: 'clip-init-1',
      content: 'https://github.com/google/crosssync-preview',
      contentType: 'text/uri-list',
      sourceDeviceId: 'android-pixel-7',
      sourceDeviceName: "Gaurav's Pixel 7",
      sourcePlatform: 'android',
      timestamp: Date.now() - 1000 * 60 * 4,
      isPinned: true,
      isFavorite: true,
      contentHash: 'f482a7b...',
      charCount: 45,
    },
    {
      id: 'clip-init-2',
      content: 'Meeting Notes: Q3 CrossSync architecture review with Tauri 2.0 & Flutter Engine.',
      contentType: 'text/plain',
      sourceDeviceId: 'win-laptop-x1',
      sourceDeviceName: "Gaurav's ThinkPad X1",
      sourcePlatform: 'windows',
      timestamp: Date.now() - 1000 * 60 * 12,
      isPinned: false,
      isFavorite: false,
      contentHash: 'a8912c...',
      charCount: 78,
    },
    {
      id: 'clip-init-3',
      content: 'git clone https://github.com/crosssync/crosssync.git && cd crosssync',
      contentType: 'text/plain',
      sourceDeviceId: 'win-laptop-x1',
      sourceDeviceName: "Gaurav's ThinkPad X1",
      sourcePlatform: 'windows',
      timestamp: Date.now() - 1000 * 60 * 35,
      isPinned: false,
      isFavorite: false,
      contentHash: 'd394bf...',
      charCount: 68,
    }
  ];

  public fileQueue: TransferQueueItem[] = [
    {
      id: 'queue-init-1',
      fileName: 'Design_Assets_2026.zip',
      fileSizeBytes: 18.4 * 1024 * 1024,
      mimeType: 'application/zip',
      direction: 'outgoing',
      sourcePlatform: 'windows',
      targetPlatform: 'android',
      status: 'queued',
      progressPercentage: 0,
      speedBytesPerSec: 0,
      startedAt: Date.now() - 1000 * 60 * 2,
    },
    {
      id: 'queue-init-2',
      fileName: 'Client_Pitch_Presentation.pptx',
      fileSizeBytes: 6.8 * 1024 * 1024,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      direction: 'outgoing',
      sourcePlatform: 'windows',
      targetPlatform: 'android',
      status: 'queued',
      progressPercentage: 0,
      speedBytesPerSec: 0,
      startedAt: Date.now() - 1000 * 60 * 2,
    },
    {
      id: 'queue-init-3',
      fileName: 'Session_Telemetry_Dump.log',
      fileSizeBytes: 1.4 * 1024 * 1024,
      mimeType: 'text/plain',
      direction: 'outgoing',
      sourcePlatform: 'windows',
      targetPlatform: 'android',
      status: 'queued',
      progressPercentage: 0,
      speedBytesPerSec: 0,
      startedAt: Date.now() - 1000 * 60 * 1,
    }
  ];

  public selectedQueueIds: Set<string> = new Set();

  public transferHistory: TransferHistoryItem[] = [
    {
      id: 'xfer-prev-1',
      fileName: 'Architecture_Design_Blueprint.pdf',
      fileSizeBytes: 4.8 * 1024 * 1024,
      mimeType: 'application/pdf',
      direction: 'outgoing',
      sourceDeviceId: 'win-laptop-x1',
      targetDeviceId: 'android-pixel-7',
      sourceDeviceName: "Gaurav's ThinkPad X1",
      targetDeviceName: "Gaurav's Pixel 7",
      status: 'completed',
      progressPercentage: 100,
      speedBytesPerSec: 12.4 * 1024 * 1024,
      startedAt: Date.now() - 1000 * 60 * 18,
      completedAt: Date.now() - 1000 * 60 * 18 + 420,
    },
    {
      id: 'xfer-prev-2',
      fileName: 'Sunset_Wallpaper_4K.jpg',
      fileSizeBytes: 8.2 * 1024 * 1024,
      mimeType: 'image/jpeg',
      direction: 'incoming',
      sourceDeviceId: 'android-pixel-7',
      targetDeviceId: 'win-laptop-x1',
      sourceDeviceName: "Gaurav's Pixel 7",
      targetDeviceName: "Gaurav's ThinkPad X1",
      status: 'completed',
      progressPercentage: 100,
      speedBytesPerSec: 15.1 * 1024 * 1024,
      startedAt: Date.now() - 1000 * 60 * 55,
      completedAt: Date.now() - 1000 * 60 * 55 + 560,
    }
  ];

  public activePacketEvents: SyncPacketEvent[] = [];
  public speedHistory: SpeedDataPoint[] = [
    { time: '10s', speedMBps: 0 },
    { time: '8s', speedMBps: 0 },
    { time: '6s', speedMBps: 0 },
    { time: '4s', speedMBps: 0 },
    { time: '2s', speedMBps: 0 },
    { time: '0s', speedMBps: 0 },
  ];

  public activeTransfer: TransferHistoryItem | null = null;
  public currentSpeedBps: number = 0;

  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('crosssync_peer_bus');
        this.broadcastChannel.onmessage = (event) => {
          this.handleExternalBusMessage(event.data);
        };
      } catch {}
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify() {
    this.listeners.forEach((l) => l());
  }

  private handleExternalBusMessage(data: any) {
    if (data?.type === 'CLIPBOARD_SYNC') {
      this.syncClipboard(data.content, data.source, false);
    }
  }

  /**
   * Sync clipboard text across devices
   */
  public async syncClipboard(content: string, sourcePlatform: 'windows' | 'android', broadcast = true) {
    if (!this.settings.clipboardSyncEnabled || !content.trim()) return;

    const hash = await computeSha256(content);
    if (this.recentHashes.has(hash)) {
      return; // Loopback suppression
    }

    this.recentHashes.add(hash);
    if (this.recentHashes.size > 30) {
      const first = Array.from(this.recentHashes)[0];
      this.recentHashes.delete(first);
    }

    const sourceDev = sourcePlatform === 'windows' ? this.windowsDevice : this.androidDevice;
    const targetPlatform = sourcePlatform === 'windows' ? 'android' : 'windows';

    const isUrl = /^https?:\/\//i.test(content.trim());
    const newItem: ClipboardItem = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      content,
      contentType: isUrl ? 'text/uri-list' : 'text/plain',
      sourceDeviceId: sourceDev.id,
      sourceDeviceName: sourceDev.name,
      sourcePlatform,
      timestamp: Date.now(),
      isPinned: false,
      isFavorite: false,
      contentHash: hash,
      charCount: content.length,
    };

    // Prepend to clipboard history
    this.clipboardHistory = [newItem, ...this.clipboardHistory.slice(0, 49)];

    // Create visual packet pulse
    const packet: SyncPacketEvent = {
      id: `pkt-${Date.now()}`,
      type: 'clipboard',
      source: sourcePlatform,
      target: targetPlatform,
      timestamp: Date.now(),
      data: { snippet: content.slice(0, 40), hash: hash.slice(0, 8) },
      status: 'decrypted',
    };
    this.activePacketEvents = [packet, ...this.activePacketEvents.slice(0, 9)];

    if (this.settings.soundFeedbackEnabled) {
      sounds.playSyncChime();
    }

    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'CLIPBOARD_SYNC',
        content,
        source: sourcePlatform,
      });
    }

    this.notify();
  }

  // ==========================================
  // BATCH SELECTION & QUEUE MANAGEMENT METHODS
  // ==========================================

  public toggleSelectQueueItem(id: string) {
    if (this.selectedQueueIds.has(id)) {
      this.selectedQueueIds.delete(id);
    } else {
      this.selectedQueueIds.add(id);
    }
    this.notify();
  }

  public selectAllQueueItems() {
    this.selectedQueueIds = new Set(this.fileQueue.map((item) => item.id));
    this.notify();
  }

  public deselectAllQueueItems() {
    this.selectedQueueIds.clear();
    this.notify();
  }

  public isAllQueueSelected(): boolean {
    if (this.fileQueue.length === 0) return false;
    return this.fileQueue.every((item) => this.selectedQueueIds.has(item.id));
  }

  public addFilesToQueue(
    files: Array<File | { name: string; size: number; type?: string; url?: string }>,
    sourcePlatform: 'windows' | 'android',
    autoStart = false
  ) {
    const targetPlatform = sourcePlatform === 'windows' ? 'android' : 'windows';
    const newItems: TransferQueueItem[] = files.map((f, idx) => {
      let fileUrl = (f as any).url;
      let thumb = undefined;
      if (f instanceof File && f.type.startsWith('image/')) {
        fileUrl = URL.createObjectURL(f);
        thumb = fileUrl;
      }
      return {
        id: `queue-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        fileName: f.name,
        fileSizeBytes: f.size,
        mimeType: f.type || 'application/octet-stream',
        direction: sourcePlatform === 'windows' ? 'outgoing' : 'incoming',
        sourcePlatform,
        targetPlatform,
        status: 'queued',
        progressPercentage: 0,
        speedBytesPerSec: 0,
        startedAt: Date.now(),
        fileBlobUrl: fileUrl,
        thumbnailBase64: thumb,
      };
    });

    this.fileQueue = [...newItems, ...this.fileQueue];
    // Select newly added items by default
    newItems.forEach((item) => this.selectedQueueIds.add(item.id));

    if (this.settings.soundFeedbackEnabled) {
      sounds.playFileStart();
    }

    if (autoStart) {
      this.sendSelectedQueueItems(newItems.map((n) => n.id));
    }

    this.notify();
  }

  public stageSampleBatch(sourcePlatform: 'windows' | 'android') {
    const samples = [
      { name: 'Architecture_Design_Spec.pdf', size: 4.8 * 1024 * 1024, type: 'application/pdf' },
      { name: '4K_Hero_Background.png', size: 12.6 * 1024 * 1024, type: 'image/png' },
      { name: 'Database_Migration_v2.sqlite', size: 8.3 * 1024 * 1024, type: 'application/x-sqlite3' },
      { name: 'App_Release_Build_2026.zip', size: 24.1 * 1024 * 1024, type: 'application/zip' },
    ];
    this.addFilesToQueue(samples, sourcePlatform, false);
  }

  /**
   * Batch Send: Starts transferring all selected items (or all queued items if none explicitly selected)
   */
  public sendSelectedQueueItems(targetIds?: string[]) {
    const idsToProcess = targetIds || (this.selectedQueueIds.size > 0 
      ? Array.from(this.selectedQueueIds) 
      : this.fileQueue.filter(i => i.status === 'queued' || i.status === 'paused').map(i => i.id)
    );

    if (idsToProcess.length === 0) return;

    if (this.settings.autoBluetoothEnabled) {
      if (!this.windowsDevice.isBluetoothEnabled) this.windowsDevice.isBluetoothEnabled = true;
      if (!this.androidDevice.isBluetoothEnabled) this.androidDevice.isBluetoothEnabled = true;
    }

    if (this.settings.soundFeedbackEnabled) {
      sounds.playFileStart();
    }

    idsToProcess.forEach((id) => {
      const item = this.fileQueue.find((q) => q.id === id);
      if (item && (item.status === 'queued' || item.status === 'paused' || item.status === 'cancelled' || item.status === 'failed')) {
        this.processQueueItem(item);
      }
    });

    this.notify();
  }

  /**
   * Batch Pause: Temporarily stops progress for selected transferring or queued items
   */
  public pauseSelectedQueueItems(targetIds?: string[]) {
    const idsToPause = targetIds || (this.selectedQueueIds.size > 0 
      ? Array.from(this.selectedQueueIds) 
      : this.fileQueue.filter(i => i.status === 'transferring').map(i => i.id)
    );

    idsToPause.forEach((id) => {
      const timer = this.queueIntervals.get(id);
      if (timer) {
        clearInterval(timer);
        this.queueIntervals.delete(id);
      }
      const item = this.fileQueue.find((q) => q.id === id);
      if (item && (item.status === 'transferring' || item.status === 'queued')) {
        item.status = 'paused';
        item.speedBytesPerSec = 0;
      }
    });

    if (this.activeTransfer && idsToPause.includes(this.activeTransfer.id)) {
      this.activeTransfer = null;
      this.currentSpeedBps = 0;
    }

    if (this.settings.soundFeedbackEnabled) {
      sounds.playPauseChime();
    }

    this.notify();
  }

  /**
   * Batch Resume: Resumes paused selected items
   */
  public resumeSelectedQueueItems(targetIds?: string[]) {
    const idsToResume = targetIds || (this.selectedQueueIds.size > 0 
      ? Array.from(this.selectedQueueIds) 
      : this.fileQueue.filter(i => i.status === 'paused').map(i => i.id)
    );

    if (idsToResume.length === 0) return;

    if (this.settings.soundFeedbackEnabled) {
      sounds.playFileStart();
    }

    idsToResume.forEach((id) => {
      const item = this.fileQueue.find((q) => q.id === id);
      if (item && item.status === 'paused') {
        this.processQueueItem(item);
      }
    });

    this.notify();
  }

  /**
   * Batch Cancel: Cancels transfers for selected items and cleans up intervals
   */
  public cancelSelectedQueueItems(targetIds?: string[]) {
    const idsToCancel = targetIds || (this.selectedQueueIds.size > 0 
      ? Array.from(this.selectedQueueIds) 
      : this.fileQueue.map(i => i.id)
    );

    idsToCancel.forEach((id) => {
      const timer = this.queueIntervals.get(id);
      if (timer) {
        clearInterval(timer);
        this.queueIntervals.delete(id);
      }
      const item = this.fileQueue.find((q) => q.id === id);
      if (item && item.status !== 'completed') {
        item.status = 'cancelled';
        item.speedBytesPerSec = 0;
      }
    });

    if (this.activeTransfer && idsToCancel.includes(this.activeTransfer.id)) {
      this.activeTransfer = null;
      this.currentSpeedBps = 0;
    }

    if (this.settings.soundFeedbackEnabled) {
      sounds.playCancelChime();
    }

    this.notify();
  }

  /**
   * Remove selected items from queue
   */
  public removeSelectedQueueItems(targetIds?: string[]) {
    const idsToRemove = new Set(targetIds || Array.from(this.selectedQueueIds));
    idsToRemove.forEach((id) => {
      const timer = this.queueIntervals.get(id);
      if (timer) {
        clearInterval(timer);
        this.queueIntervals.delete(id);
      }
    });

    this.fileQueue = this.fileQueue.filter((item) => !idsToRemove.has(item.id));
    idsToRemove.forEach((id) => this.selectedQueueIds.delete(id));
    this.notify();
  }

  /**
   * Clear all completed and cancelled items from the queue
   */
  public clearCompletedQueue() {
    this.fileQueue = this.fileQueue.filter((item) => item.status === 'queued' || item.status === 'transferring' || item.status === 'paused');
    this.selectedQueueIds.clear();
    this.notify();
  }

  /**
   * Process an individual queue item with chunk simulation
   */
  private processQueueItem(item: TransferQueueItem) {
    if (this.queueIntervals.has(item.id)) {
      clearInterval(this.queueIntervals.get(item.id));
    }

    item.status = 'transferring';
    item.startedAt = item.startedAt || Date.now();

    // Mirror to activeTransfer for banner compatibility
    const sourceDev = item.sourcePlatform === 'windows' ? this.windowsDevice : this.androidDevice;
    const targetDev = item.sourcePlatform === 'windows' ? this.androidDevice : this.windowsDevice;

    const historyRepresentation: TransferHistoryItem = {
      id: item.id,
      fileName: item.fileName,
      fileSizeBytes: item.fileSizeBytes,
      mimeType: item.mimeType,
      direction: item.direction,
      sourceDeviceId: sourceDev.id,
      targetDeviceId: targetDev.id,
      sourceDeviceName: sourceDev.name,
      targetDeviceName: targetDev.name,
      status: 'in_progress',
      progressPercentage: item.progressPercentage,
      speedBytesPerSec: 0,
      startedAt: item.startedAt,
      fileBlobUrl: item.fileBlobUrl,
      thumbnailBase64: item.thumbnailBase64,
    };
    this.activeTransfer = historyRepresentation;

    const totalBytes = item.fileSizeBytes;
    const durationMs = Math.max(1500, Math.min(5000, (totalBytes / 1024 / 1024) * 500));
    const intervalTime = 80;
    const totalSteps = Math.ceil(durationMs / intervalTime);
    let currentStep = Math.round((item.progressPercentage / 100) * totalSteps);
    const startTime = Date.now() - (currentStep * intervalTime);

    const timer = setInterval(() => {
      currentStep++;
      const rawProgress = Math.min(100, (currentStep / totalSteps) * 100);
      const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
      const transferredBytes = (rawProgress / 100) * totalBytes;
      const currentSpeed = transferredBytes / elapsedSec;

      item.progressPercentage = Math.round(rawProgress);
      item.speedBytesPerSec = Math.round(currentSpeed);
      this.currentSpeedBps = currentSpeed;

      const speedMBps = currentSpeed / (1024 * 1024);
      const nowStr = new Date().toLocaleTimeString().slice(3, 8);
      this.speedHistory = [
        ...this.speedHistory.slice(1),
        { time: nowStr, speedMBps: parseFloat(speedMBps.toFixed(2)) },
      ];

      if (this.activeTransfer && this.activeTransfer.id === item.id) {
        this.activeTransfer.progressPercentage = item.progressPercentage;
        this.activeTransfer.speedBytesPerSec = item.speedBytesPerSec;
      }

      // Check if this item is finished
      if (currentStep >= totalSteps) {
        clearInterval(timer);
        this.queueIntervals.delete(item.id);

        item.status = 'completed';
        item.progressPercentage = 100;
        item.completedAt = Date.now();
        item.speedBytesPerSec = 0;

        // Push to history
        this.transferHistory = [
          {
            id: item.id,
            fileName: item.fileName,
            fileSizeBytes: item.fileSizeBytes,
            mimeType: item.mimeType,
            direction: item.direction,
            sourceDeviceId: sourceDev.id,
            targetDeviceId: targetDev.id,
            sourceDeviceName: sourceDev.name,
            targetDeviceName: targetDev.name,
            status: 'completed',
            progressPercentage: 100,
            speedBytesPerSec: Math.round(currentSpeed),
            startedAt: item.startedAt!,
            completedAt: item.completedAt,
            fileBlobUrl: item.fileBlobUrl,
            thumbnailBase64: item.thumbnailBase64,
          },
          ...this.transferHistory,
        ];

        if (this.activeTransfer && this.activeTransfer.id === item.id) {
          this.activeTransfer = null;
          this.currentSpeedBps = 0;
        }

        if (this.settings.soundFeedbackEnabled) {
          sounds.playTransferComplete();
        }
      }

      this.notify();
    }, intervalTime);

    this.queueIntervals.set(item.id, timer);
    this.notify();
  }

  /**
   * Start file transfer from source device to target device (legacy single helper)
   */
  public async startFileTransfer(
    file: File | { name: string; size: number; type: string; url?: string },
    sourcePlatform: 'windows' | 'android'
  ) {
    this.addFilesToQueue([file], sourcePlatform, true);
  }

  public toggleBluetooth(platform: 'windows' | 'android') {
    if (platform === 'windows') {
      this.windowsDevice.isBluetoothEnabled = !this.windowsDevice.isBluetoothEnabled;
    } else {
      this.androidDevice.isBluetoothEnabled = !this.androidDevice.isBluetoothEnabled;
    }
    this.notify();
  }

  public togglePinClipboard(id: string) {
    this.clipboardHistory = this.clipboardHistory.map((item) =>
      item.id === id ? { ...item, isPinned: !item.isPinned } : item
    );
    this.notify();
  }

  public deleteClipboard(id: string) {
    this.clipboardHistory = this.clipboardHistory.filter((item) => item.id !== id);
    this.notify();
  }

  public clearClipboardHistory() {
    this.clipboardHistory = this.clipboardHistory.filter((item) => item.isPinned);
    this.notify();
  }

  public completePairing(newDeviceName: string) {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    this.notify();
  }
}

export const syncEngine = new SyncEngine();

