import React, { useState, useRef } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Bluetooth, 
  Wifi, 
  ShieldCheck, 
  UploadCloud, 
  ClipboardCopy, 
  Copy, 
  Check, 
  Pin, 
  Trash2, 
  Search, 
  Plus, 
  Activity, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Sparkles,
  ExternalLink,
  Settings,
  Minimize2,
  Square,
  X,
  Radio,
  Send,
  QrCode,
  EyeOff,
  ShieldAlert,
  Layers,
  History
} from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { TransferSpeedGraph } from './TransferSpeedGraph';
import { QrPairingModal } from './QrPairingModal';
import { BatchTransferQueue } from './BatchTransferQueue';
import { formatBytes, formatSpeed } from '../../shared/protocol';

interface Props {
  onOpenCodeExplorer?: () => void;
  onOpenDbInspector?: () => void;
  onOpenQrModal?: () => void;
}

export const WindowsDesktop: React.FC<Props> = ({ 
  onOpenCodeExplorer, 
  onOpenDbInspector,
  onOpenQrModal 
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickClipInput, setQuickClipInput] = useState('');
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTrayMenu, setShowTrayMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [leftTab, setLeftTab] = useState<'batchQueue' | 'history'>('batchQueue');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    windowsDevice,
    androidDevice,
    clipboardHistory,
    transferHistory,
    fileQueue,
    activeTransfer,
    currentSpeedBps,
    speedHistory,
    settings,
  } = syncEngine;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSendLocalClip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClipInput.trim()) return;
    syncEngine.syncClipboard(quickClipInput, 'windows');
    setQuickClipInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray: File[] = Array.from(e.target.files);
      if (filesArray.length === 1) {
        syncEngine.startFileTransfer(filesArray[0], 'windows');
      } else {
        syncEngine.addFilesToQueue(filesArray, 'windows', false);
      }
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray: File[] = Array.from(e.dataTransfer.files);
      if (filesArray.length === 1) {
        syncEngine.startFileTransfer(filesArray[0], 'windows');
      } else {
        syncEngine.addFilesToQueue(filesArray, 'windows', false);
      }
    }
  };

  const filteredClips = clipboardHistory.filter((c) =>
    c.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const samplePresets = [
    { name: 'Product_Roadmap_2026.pdf', size: 3.4 * 1024 * 1024, type: 'application/pdf' },
    { name: 'Tokyo_Night_Photography.jpg', size: 6.8 * 1024 * 1024, type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80' },
    { name: 'CrossSync_Core_Engine.zip', size: 14.2 * 1024 * 1024, type: 'application/zip' }
  ];

  return (
    <div 
      id="windows-desktop-container" 
      className="relative flex flex-col h-full rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl transition-all select-none"
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
      }}
      onClick={() => {
        if (contextMenuPos) setContextMenuPos(null);
        if (showTrayMenu) setShowTrayMenu(false);
      }}
    >
      {/* Windows 11 Acrylic Titlebar */}
      <div id="windows-titlebar" className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
            <Laptop className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-gray-200">
            CrossSync Desktop — {windowsDevice.name}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Tauri / Rust v1.0
          </span>
        </div>

        {/* Windows Window Controls */}
        <div className="flex items-center gap-1">
          <button 
            id="win-minimize-btn" 
            onClick={() => setShowTrayMenu(true)} 
            title="Minimize to System Tray"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button id="win-maximize-btn" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Square className="w-3 h-3" />
          </button>
          <button id="win-close-btn" className="p-1.5 rounded hover:bg-red-500/80 text-gray-400 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Device Banner & Quick Stats */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-blue-950/30 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0B0F17] ${
              androidDevice.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-gray-500'
            }`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">{androidDevice.name}</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> AES-256 Paired
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Bluetooth className={`w-3.5 h-3.5 ${androidDevice.isBluetoothEnabled ? 'text-cyan-400' : 'text-gray-500'}`} />
                {androidDevice.isBluetoothEnabled ? 'RFCOMM Active' : 'BT Disabled'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-blue-400" />
                LAN 192.168.1.105
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Speed Graph */}
        <div className="flex items-center gap-3">
          <TransferSpeedGraph 
            data={speedHistory} 
            currentSpeedBps={currentSpeedBps} 
            isTransferring={!!activeTransfer} 
          />

          <button
            id="win-auto-bt-toggle"
            onClick={() => syncEngine.toggleBluetooth('windows')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              windowsDevice.isBluetoothEnabled 
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' 
                : 'bg-gray-800/50 border-white/10 text-gray-400'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            {windowsDevice.isBluetoothEnabled ? 'Auto-BT On' : 'BT Off'}
          </button>

          <button
            id="win-qr-pair-btn"
            onClick={() => {
              if (onOpenQrModal) {
                onOpenQrModal();
              } else {
                setIsPairingOpen(true);
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 shadow-sm transition-all flex items-center gap-1.5"
            title="Generate Unique Pairing QR Code"
          >
            <QrCode className="w-3.5 h-3.5" /> QR Pair
          </button>

          <button
            id="win-pair-modal-btn"
            onClick={() => setIsPairingOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-md transition-all flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" /> Pair Device
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto min-h-0">
        
        {/* Left Column: Drag-and-Drop File Send, Batch Transfer Queue & History */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Drag & Drop Target Zone with multi-file support */}
          <div
            id="windows-drop-zone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
              isDragOver 
                ? 'border-cyan-400 bg-cyan-500/15 scale-[1.01]' 
                : 'border-white/15 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-white/[0.04]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-2">
              <UploadCloud className="w-5 h-5 animate-bounce" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">Drag & Drop Multiple Files Here</h4>
            <p className="text-[11px] text-gray-400 max-w-xs">
              Select multiple files to stage in the batch queue with AES-256 GCM encryption.
            </p>
          </div>

          {/* Tab Bar: Batch Queue vs. History */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              id="win-tab-batch-queue"
              onClick={() => setLeftTab('batchQueue')}
              className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                leftTab === 'batchQueue'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Queue ({fileQueue.length})</span>
            </button>
            <button
              id="win-tab-history"
              onClick={() => setLeftTab('history')}
              className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                leftTab === 'history'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Transfers History ({transferHistory.length})</span>
            </button>
          </div>

          {/* Active Tab View */}
          {leftTab === 'batchQueue' ? (
            <div className="flex-1 min-h-[300px]">
              <BatchTransferQueue platform="windows" />
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-3 flex-1 overflow-hidden flex flex-col min-h-[260px]">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Recent Sent & Received Files
              </span>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {transferHistory.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-8">No transfer history yet.</div>
                ) : (
                  transferHistory.map((xfer) => (
                    <div key={xfer.id} className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`p-1.5 rounded-lg ${xfer.direction === 'outgoing' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {xfer.mimeType.includes('image') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-gray-200 truncate">{xfer.fileName}</div>
                          <div className="text-[10px] text-gray-400">
                            {xfer.direction === 'outgoing' ? 'Sent to phone' : 'Received from phone'} • {formatBytes(xfer.fileSizeBytes)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                        {xfer.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Quick Presets for Instant Demo Send */}
          <div className="glass-card rounded-2xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Quick Single Payloads
              </span>
              <button
                onClick={() => syncEngine.stageSampleBatch('windows')}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3 h-3" /> Add 4 Files to Batch Queue
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  id={`send-preset-${idx}`}
                  onClick={() => syncEngine.startFileTransfer(preset, 'windows')}
                  className="p-2 rounded-xl bg-black/20 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 mb-1 text-cyan-400">
                    {preset.type.includes('image') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-mono text-gray-400">{formatBytes(preset.size)}</span>
                  </div>
                  <div className="text-[10px] font-medium text-gray-200 truncate group-hover:text-cyan-300">
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Clipboard Synchronization Hub */}
        <div className="lg:col-span-7 flex flex-col gap-3 glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                <ClipboardCopy className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Live Clipboard Sync Hub</h3>
            </div>
            <span className="text-[11px] text-gray-400">
              Copy on phone → Instant <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-cyan-300">Ctrl+V</kbd>
            </span>
          </div>

          {/* Quick Push Input Form */}
          <form onSubmit={handleSendLocalClip} className="flex gap-2">
            <input
              id="windows-quick-clip-input"
              type="text"
              placeholder="Type or paste text/URL to sync to Gaurav's Pixel 7..."
              value={quickClipInput}
              onChange={(e) => setQuickClipInput(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              id="windows-send-clip-btn"
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Sync
            </button>
          </form>

          {/* Search Filter & Clear */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                id="search-clipboard-input"
                type="text"
                placeholder="Search clipboard items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>
            <button
              id="clear-clips-btn"
              onClick={() => syncEngine.clearClipboardHistory()}
              className="px-2.5 py-1.5 text-[11px] rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              Clear Unpinned
            </button>
          </div>

          {/* Clipboard Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
            {filteredClips.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <ClipboardCopy className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No clipboard items found</p>
              </div>
            ) : (
              filteredClips.map((clip) => (
                <div
                  key={clip.id}
                  id={`clip-item-${clip.id}`}
                  className="p-3 rounded-xl bg-black/25 hover:bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-200 font-mono break-all line-clamp-3 select-text">
                      {clip.content}
                    </span>
                    <div className="flex items-center gap-1 opacity-90">
                      <button
                        id={`pin-clip-${clip.id}`}
                        onClick={() => syncEngine.togglePinClipboard(clip.id)}
                        className={`p-1 rounded hover:bg-white/10 ${clip.isPinned ? 'text-cyan-400' : 'text-gray-500'}`}
                        title={clip.isPinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`copy-clip-${clip.id}`}
                        onClick={() => handleCopy(clip.id, clip.content)}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-cyan-300"
                        title="Copy to Windows Clipboard"
                      >
                        {copiedId === clip.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        id={`delete-clip-${clip.id}`}
                        onClick={() => syncEngine.deleteClipboard(clip.id)}
                        className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${clip.sourcePlatform === 'android' ? 'bg-cyan-400' : 'bg-blue-400'}`} />
                      Synced from {clip.sourceDeviceName}
                    </span>
                    <span>{clip.charCount} chars • {new Date(clip.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Windows 11 Taskbar & System Tray */}
      <div id="windows-taskbar" className="h-11 bg-black/60 border-t border-white/10 backdrop-blur-2xl flex items-center justify-between px-4">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Background Service: Active (<strong className="text-gray-300 font-normal">0.03% CPU</strong>)
          </span>
        </div>

        {/* System Tray Icons */}
        <div className="relative flex items-center gap-3">
          <button
            id="tray-icon-btn"
            onClick={() => setShowTrayMenu(!showTrayMenu)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-cyan-300 flex items-center gap-1 transition-colors"
            title="CrossSync Background Tray"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-300 font-mono">{new Date().toLocaleTimeString().slice(0, 5)}</span>

          {/* System Tray Flyout Menu */}
          {showTrayMenu && (
            <div id="system-tray-flyout" className="absolute bottom-12 right-0 w-64 bg-[#0F172A]/95 border border-cyan-500/30 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-white z-50">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">CrossSync Background Service</span>
              </div>
              <div className="text-[11px] text-gray-300 space-y-1.5 mb-3">
                <div className="flex justify-between">
                  <span>Connected Device:</span>
                  <span className="font-semibold text-cyan-300">Pixel 7</span>
                </div>
                <div className="flex justify-between">
                  <span>Power Impact:</span>
                  <span className="text-emerald-400 font-mono">0.18% / hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Event Hook:</span>
                  <span className="font-mono text-gray-400">AddClipboardListener</span>
                </div>
              </div>
              <button
                onClick={() => setShowTrayMenu(false)}
                className="w-full py-1.5 text-center text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg font-medium transition-colors"
              >
                Close Flyout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Windows Right-Click Context Menu */}
      {contextMenuPos && (
        <div
          id="windows-context-menu"
          style={{ top: contextMenuPos.y - 100, left: contextMenuPos.x - 200 }}
          className="fixed z-50 w-56 bg-[#0F172A]/95 border border-cyan-500/30 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl text-white text-xs"
        >
          <button
            onClick={() => {
              syncEngine.startFileTransfer(samplePresets[0], 'windows');
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cyan-500/20 text-cyan-300 text-left"
          >
            <Send className="w-3.5 h-3.5" /> Send to Gaurav's Pixel 7
          </button>
          <button
            onClick={() => {
              setIsPairingOpen(true);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 text-left"
          >
            <Radio className="w-3.5 h-3.5" /> Pair New Android Device
          </button>
        </div>
      )}

      {/* Pairing Modal */}
      <QrPairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        initialPlatform="windows"
      />
    </div>
  );
};
