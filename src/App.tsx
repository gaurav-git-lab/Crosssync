import React, { useState, useEffect } from 'react';
import { HeaderNavigation } from './components/HeaderNavigation';
import { WindowsDesktop } from './components/WindowsDesktop';
import { AndroidPhone } from './components/AndroidPhone';
import { DatabaseInspector } from './components/DatabaseInspector';
import { CodeExplorer } from './components/CodeExplorer';
import { QrPairingModal } from './components/QrPairingModal';
import { ActiveViewMode } from './types';
import { syncEngine } from './services/syncEngine';
import { 
  ArrowRightLeft, 
  Sparkles, 
  ShieldCheck, 
  Bluetooth, 
  Wifi, 
  Zap, 
  Layers, 
  Activity, 
  Cpu, 
  Battery, 
  Info,
  Send,
  FileText,
  Copy,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveViewMode>('dual');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalPlatform, setQrModalPlatform] = useState<'windows' | 'android'>('windows');
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const latestPacket = syncEngine.activePacketEvents[0];

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-[#070A11] text-gray-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans transition-colors`}>
      
      {/* Dynamic Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Header Bar */}
      <HeaderNavigation
        activeView={activeView}
        onViewChange={setActiveView}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
        onOpenQrModal={() => {
          setQrModalPlatform('windows');
          setIsQrModalOpen(true);
        }}
      />

      {/* Hero Interactive Quick Action Bar */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-4 pt-3 pb-1">
        <div className="p-3 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-300">
              <Zap className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-gray-200">Instant CrossSync Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="test-action-open-qr-modal"
              onClick={() => {
                setQrModalPlatform('windows');
                setIsQrModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/25 to-blue-600/25 hover:from-cyan-500/40 hover:to-blue-600/40 border border-cyan-500/40 text-cyan-300 transition-all flex items-center gap-1.5 font-semibold shadow-[0_0_12px_rgba(0,229,255,0.2)]"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" /> Generate QR Code Pair
            </button>

            <button
              id="test-action-copy-phone"
              onClick={() => syncEngine.syncClipboard(`https://crosssync.dev/share/${Math.floor(Math.random()*9000+1000)}`, 'android')}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 transition-all flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" /> Copy URL on Phone → Paste on Laptop
            </button>

            <button
              id="test-action-copy-laptop"
              onClick={() => syncEngine.syncClipboard(`docker run -p 52849:52849 crosssync/bridge:v1.0`, 'windows')}
              className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 transition-all flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" /> Copy Text on Laptop → Paste on Phone
            </button>

            <button
              id="test-action-stage-batch"
              onClick={() => syncEngine.stageSampleBatch('windows')}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 transition-all flex items-center gap-1.5 font-semibold"
              title="Stage 4 sample files in the batch transfer queue"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Stage Batch Queue (4 Files)
            </button>

            <button
              id="test-action-send-sample-doc"
              onClick={() => syncEngine.startFileTransfer({ name: 'CrossSync_Spec_v1.pdf', size: 5.2 * 1024 * 1024, type: 'application/pdf' }, 'windows')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" /> Quick 5.2MB File
            </button>
          </div>

          <div className="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> &lt;0.05% CPU
            </span>
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-emerald-400" /> &lt;0.2%/hr Batt
            </span>
          </div>
        </div>
      </section>

      {/* Main Interactive Stage */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col min-h-0">
        
        {/* VIEW 1: Dual Device Live View */}
        {activeView === 'dual' && (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start min-h-[640px]">
            
            {/* Windows Desktop Shell (Left / 7 cols) */}
            <div className="xl:col-span-7 h-[700px]">
              <WindowsDesktop
                onOpenCodeExplorer={() => setActiveView('code')}
                onOpenDbInspector={() => setActiveView('database')}
                onOpenQrModal={() => {
                  setQrModalPlatform('windows');
                  setIsQrModalOpen(true);
                }}
              />
            </div>

            {/* Center Animated RFCOMM / LAN Transmission Beam */}
            <div className="hidden xl:flex xl:col-span-1 h-[700px] flex-col items-center justify-center relative">
              <div className="w-[1px] h-4/5 bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent relative">
                {latestPacket && (
                  <motion.div
                    key={latestPacket.id}
                    initial={{ top: latestPacket.source === 'windows' ? '10%' : '90%', opacity: 0 }}
                    animate={{ top: latestPacket.source === 'windows' ? '90%' : '10%', opacity: 1 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className="absolute -left-3 p-1.5 rounded-full bg-cyan-400 text-black shadow-[0_0_15px_#00E5FF]"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] font-mono text-cyan-400 block font-semibold">AES-256</span>
                <span className="text-[9px] text-gray-500 font-mono">RFCOMM</span>
              </div>
            </div>

            {/* Android Phone Shell (Right / 4 cols) */}
            <div className="xl:col-span-4 h-[700px] flex justify-center">
              <AndroidPhone 
                onOpenQrModal={() => {
                  setQrModalPlatform('android');
                  setIsQrModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Windows Desktop Focused View */}
        {activeView === 'windows' && (
          <div className="flex-1 h-[720px]">
            <WindowsDesktop
              onOpenCodeExplorer={() => setActiveView('code')}
              onOpenDbInspector={() => setActiveView('database')}
              onOpenQrModal={() => {
                setQrModalPlatform('windows');
                setIsQrModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 3: Android Phone Focused View */}
        {activeView === 'android' && (
          <div className="flex-1 flex justify-center items-center py-4">
            <AndroidPhone 
              onOpenQrModal={() => {
                setQrModalPlatform('android');
                setIsQrModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 4: Database Inspector View */}
        {activeView === 'database' && (
          <div className="flex-1 h-[680px]">
            <DatabaseInspector />
          </div>
        )}

        {/* VIEW 5: Code Explorer View */}
        {activeView === 'code' && (
          <div className="flex-1 h-[680px]">
            <CodeExplorer />
          </div>
        )}
      </main>

      {/* Universal Dynamic QR Pairing Modal */}
      <QrPairingModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        initialPlatform={qrModalPlatform}
      />

      {/* Footer Info */}
      <footer className="relative z-10 glass-panel border-t border-white/10 px-4 py-2.5 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>CrossSync • Direct P2P Sync between Windows (Tauri) & Android (Flutter)</span>
          <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500">
            <span>Bluetooth UUID: 7A91D0E0-4E38-40F4</span>
            <span>WebSocket: :52849</span>
            <span className="text-emerald-400">AES-GCM Authenticated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
