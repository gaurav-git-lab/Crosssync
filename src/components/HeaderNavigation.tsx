import React from 'react';
import { 
  Laptop, 
  Smartphone, 
  Columns, 
  Database, 
  Code2, 
  ShieldCheck, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bluetooth, 
  Sun, 
  Moon,
  Radio,
  QrCode
} from 'lucide-react';
import { ActiveViewMode } from '../types';
import { syncEngine } from '../services/syncEngine';

interface Props {
  activeView: ActiveViewMode;
  onViewChange: (view: ActiveViewMode) => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onOpenQrModal: () => void;
}

export const HeaderNavigation: React.FC<Props> = ({
  activeView,
  onViewChange,
  isDarkTheme,
  onToggleTheme,
  onOpenQrModal,
}) => {
  const { settings, windowsDevice, androidDevice } = syncEngine;

  return (
    <header id="main-header" className="glass-panel border-b border-white/10 px-4 py-3 sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo & Core Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">CrossSync</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v1.0 MVP
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Windows (Tauri/Rust) & Android (Flutter) Peer Sync</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto">
          <button
            id="view-tab-dual"
            onClick={() => onViewChange('dual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'dual'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" /> Dual Device Live View
          </button>

          <button
            id="view-tab-windows"
            onClick={() => onViewChange('windows')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'windows'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" /> Windows Desktop
          </button>

          <button
            id="view-tab-android"
            onClick={() => onViewChange('android')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'android'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Android Phone
          </button>

          <button
            id="view-tab-database"
            onClick={() => onViewChange('database')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'database'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> SQLite DB
          </button>

          <button
            id="view-tab-code"
            onClick={() => onViewChange('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'code'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> Code & Docs
          </button>
        </div>

        {/* Global Status & Quick Controls */}
        <div className="flex items-center gap-2.5">
          <button
            id="header-open-qr-pairing-btn"
            onClick={onOpenQrModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-[0_0_12px_rgba(0,229,255,0.2)] transition-all"
            title="Generate Unique QR Code for Device Pairing"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>QR Pair</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AES-256 E2EE</span>
          </div>

          <button
            id="toggle-sound-btn"
            onClick={() => {
              settings.soundFeedbackEnabled = !settings.soundFeedbackEnabled;
              syncEngine.notify?.();
            }}
            title={settings.soundFeedbackEnabled ? 'Disable Audio Chimes' : 'Enable Audio Chimes'}
            className={`p-2 rounded-xl border transition-all ${
              settings.soundFeedbackEnabled
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-black/20 border-white/5 text-gray-500'
            }`}
          >
            {settings.soundFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="toggle-theme-btn"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:text-white transition-all"
            title="Toggle theme"
          >
            {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
