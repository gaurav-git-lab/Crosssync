import React, { useState } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Bluetooth, 
  Wifi, 
  ShieldCheck, 
  Clipboard, 
  Copy, 
  Check, 
  Send, 
  Share2, 
  QrCode, 
  Camera, 
  FolderDown, 
  ImageIcon, 
  FileText, 
  Sparkles, 
  BatteryMedium,
  Radio,
  ExternalLink,
  ChevronDown,
  Bell,
  Layers
} from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { QrPairingModal } from './QrPairingModal';
import { BatchTransferQueue } from './BatchTransferQueue';
import { formatBytes } from '../../shared/protocol';

interface Props {
  onOpenQrModal?: () => void;
}

export const AndroidPhone: React.FC<Props> = ({ onOpenQrModal }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileInputText, setMobileInputText] = useState('');
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<'clipboard' | 'queue' | 'files'>('queue');

  const {
    androidDevice,
    windowsDevice,
    clipboardHistory,
    transferHistory,
    fileQueue,
    activeTransfer,
    settings,
  } = syncEngine;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSendMobileClip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileInputText.trim()) return;
    syncEngine.syncClipboard(mobileInputText, 'android');
    setMobileInputText('');
  };

  const mobilePresets = [
    { name: 'Camera_DCIM_9941.jpg', size: 4.1 * 1024 * 1024, type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
    { name: 'Invoice_Travel_Receipt.pdf', size: 1.2 * 1024 * 1024, type: 'application/pdf' },
    { name: 'Voice_Memo_Recorded.m4a', size: 2.8 * 1024 * 1024, type: 'audio/m4a' },
  ];

  return (
    <div id="android-phone-outer-frame" className="relative mx-auto w-full max-w-[390px] h-[720px] rounded-[44px] bg-[#0A0E17] p-3 shadow-2xl border-[4px] border-slate-700/60 flex flex-col justify-between select-none">
      
      {/* Screen Surface */}
      <div id="android-screen-surface" className="relative flex-1 rounded-[36px] bg-[#0D121F] overflow-hidden flex flex-col border border-white/5 shadow-inner">
        
        {/* Status Bar */}
        <div id="android-status-bar" className="h-9 px-6 pt-2 flex items-center justify-between text-[11px] font-semibold text-gray-300 z-20">
          <span>{new Date().toLocaleTimeString().slice(0, 5)}</span>
          
          {/* Dynamic Punch-Hole Camera */}
          <div className="w-4 h-4 rounded-full bg-black border border-white/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1e293b]" />
          </div>

          <div className="flex items-center gap-1.5">
            <Bluetooth className={`w-3 h-3 ${androidDevice.isBluetoothEnabled ? 'text-cyan-400' : 'text-gray-500'}`} />
            <Wifi className="w-3 h-3 text-white" />
            <span className="text-[10px] font-mono">78%</span>
            <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Persistent Android Foreground Notification Pill */}
        <div id="android-foreground-notification" className="mx-3 mt-1 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/25 flex items-center justify-between text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="text-[11px] font-bold text-white truncate">CrossSync Foreground Service</div>
              <div className="text-[10px] text-cyan-300">Connected to ThinkPad X1 • 0.2% batt/hr</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
          
          {/* Device Pairing Header */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{windowsDevice.name}</h4>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Paired & Encrypted (AES-256)
                </p>
              </div>
            </div>

            <button
              id="android-qr-scan-btn"
              onClick={() => {
                if (onOpenQrModal) {
                  onOpenQrModal();
                } else {
                  setIsPairingOpen(true);
                }
              }}
              className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5"
              title="Pair with QR Code"
            >
              <QrCode className="w-4 h-4" />
              <span className="text-[10px] font-semibold pr-0.5">QR</span>
            </button>
          </div>

          {/* Quick Push from Phone */}
          <form onSubmit={handleSendMobileClip} className="flex gap-2">
            <input
              id="android-quick-input"
              type="text"
              placeholder="Type message/link to sync to laptop..."
              value={mobileInputText}
              onChange={(e) => setMobileInputText(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              id="android-send-btn"
              type="submit"
              className="p-2 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Share Sheet Trigger & Test Payloads */}
          <div className="p-2.5 rounded-2xl bg-black/30 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Android Native Share Sheet
              </span>
              <button
                id="open-share-sheet-btn"
                onClick={() => setShowShareSheet(!showShareSheet)}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" /> Simulate Share
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {mobilePresets.map((preset, idx) => (
                <button
                  key={idx}
                  id={`android-share-preset-${idx}`}
                  onClick={() => syncEngine.startFileTransfer(preset, 'android')}
                  className="p-2 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-left transition-all"
                >
                  <div className="flex items-center gap-1 text-cyan-400 mb-1">
                    {preset.type.includes('image') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    <span className="text-[9px] font-mono text-gray-400">{formatBytes(preset.size)}</span>
                  </div>
                  <div className="text-[10px] font-medium text-gray-200 truncate">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Transfer on Phone */}
          {activeTransfer && (
            <div id="android-active-xfer" className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-white truncate max-w-[180px]">{activeTransfer.fileName}</span>
                <span className="text-cyan-300 font-mono text-[11px]">{activeTransfer.progressPercentage}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100 rounded-full"
                  style={{ width: `${activeTransfer.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Tabs: Clipboard History / Batch Queue / Files Inbox */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
            <button
              id="android-tab-queue"
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'queue' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Queue ({fileQueue.length})</span>
            </button>
            <button
              id="android-tab-clips"
              onClick={() => setActiveTab('clipboard')}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                activeTab === 'clipboard' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400'
              }`}
            >
              Clips ({clipboardHistory.length})
            </button>
            <button
              id="android-tab-files"
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                activeTab === 'files' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400'
              }`}
            >
              Inbox ({transferHistory.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'queue' ? (
            <div className="min-h-[220px]">
              <BatchTransferQueue platform="android" compact />
            </div>
          ) : activeTab === 'clipboard' ? (
            <div className="space-y-2">
              {clipboardHistory.slice(0, 5).map((clip) => (
                <div
                  key={clip.id}
                  id={`android-clip-${clip.id}`}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-gray-200 font-mono break-all line-clamp-2">
                      {clip.content}
                    </span>
                    <button
                      id={`android-copy-btn-${clip.id}`}
                      onClick={() => handleCopy(clip.id, clip.content)}
                      className="p-1 rounded bg-black/40 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300"
                      title="Copy to Mobile Clipboard"
                    >
                      {copiedId === clip.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-gray-500">
                    <span>{clip.sourcePlatform === 'windows' ? '💻 Synced from Windows' : '📱 Local mobile clip'}</span>
                    <span>{new Date(clip.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {transferHistory.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                      {item.mimeType.includes('image') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </div>
                    <div className="truncate">
                      <div className="text-[11px] font-medium text-white truncate">{item.fileName}</div>
                      <div className="text-[9px] text-gray-400">{formatBytes(item.fileSizeBytes)}</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Saved to /Download
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Android 3-Button Navigation Bar */}
        <div id="android-navbar" className="h-8 bg-black/60 flex items-center justify-around text-gray-500 border-t border-white/5">
          <div className="w-3 h-3 border-l-2 border-b-2 border-gray-400 rotate-45" />
          <div className="w-3 h-3 rounded-full border-2 border-gray-400" />
          <div className="w-3 h-3 border-2 border-gray-400 rounded-sm" />
        </div>
      </div>

      {/* Simulated Android Native Share Sheet Modal */}
      {showShareSheet && (
        <div
          id="android-share-sheet-modal"
          className="absolute inset-x-3 bottom-3 bg-[#111827]/95 border border-cyan-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-50 text-white animate-in slide-in-from-bottom"
        >
          <div className="w-10 h-1 rounded-full bg-gray-600 mx-auto mb-3" />
          <h4 className="text-xs font-bold mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-400" /> Share via CrossSync
          </h4>
          <button
            onClick={() => {
              syncEngine.startFileTransfer(mobilePresets[0], 'android');
              setShowShareSheet(false);
            }}
            className="w-full p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-left flex items-center gap-3 mb-2"
          >
            <div className="p-2 rounded-lg bg-cyan-500 text-black">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Send to {windowsDevice.name}</div>
              <div className="text-[10px] text-cyan-300">Instant RFCOMM / LAN Transfer</div>
            </div>
          </button>
          <button
            onClick={() => setShowShareSheet(false)}
            className="w-full py-2 text-center text-xs text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Pairing Modal */}
      <QrPairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        initialPlatform="android"
      />
    </div>
  );
};
