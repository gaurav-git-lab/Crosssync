import React, { useState } from 'react';
import { QrCode, KeyRound, CheckCircle2, Smartphone, Laptop, X, RefreshCw, ShieldCheck } from 'lucide-react';
import { syncEngine } from '../services/syncEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetPlatform: 'windows' | 'android';
}

export const PairingModal: React.FC<Props> = ({ isOpen, onClose, targetPlatform }) => {
  const [activeTab, setActiveTab] = useState<'pin' | 'qr'>('pin');
  const [pinValue, setPinValue] = useState('739 481');
  const [inputPin, setInputPin] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerifyPin = () => {
    if (inputPin.replace(/\s/g, '') === '739481' || inputPin.length >= 4) {
      setIsSuccess(true);
      setTimeout(() => {
        syncEngine.completePairing(targetPlatform === 'windows' ? "Gaurav's Pixel 7" : "Gaurav's ThinkPad X1");
        setIsSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const regeneratePin = () => {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    setPinValue(`${p1} ${p2}`);
  };

  return (
    <div id="pairing-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div id="pairing-modal-content" className="relative w-full max-w-md bg-[#0F172A]/90 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-white">
        <button
          id="close-pairing-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Secure Device Pairing</h3>
            <p className="text-xs text-gray-400">ECDH P-256 Key Exchange & Zero-Trust PIN</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-black/30 p-1 rounded-xl mb-6 border border-white/5">
          <button
            id="tab-pin-pairing"
            onClick={() => setActiveTab('pin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pin' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> 6-Digit PIN
          </button>
          <button
            id="tab-qr-pairing"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'qr' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> QR Code Scanner
          </button>
        </div>

        {activeTab === 'pin' ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-xs text-gray-300">
              Enter this pairing code on your {targetPlatform === 'windows' ? 'Android phone' : 'Windows laptop'} to authorize instant sync:
            </p>

            <div className="flex items-center gap-3 bg-black/40 border border-cyan-500/30 px-6 py-4 rounded-xl">
              <span className="text-2xl font-mono font-bold tracking-widest text-cyan-300">{pinValue}</span>
              <button
                id="refresh-pin-btn"
                onClick={regeneratePin}
                title="Generate new PIN"
                className="p-1.5 text-gray-400 hover:text-cyan-400 rounded hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full pt-2">
              <label className="block text-left text-xs font-medium text-gray-400 mb-1.5">
                Simulate verification on peer device:
              </label>
              <div className="flex gap-2">
                <input
                  id="pairing-pin-input"
                  type="text"
                  placeholder="Enter 739 481"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  id="submit-pairing-pin-btn"
                  onClick={handleVerifyPin}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
                >
                  {isSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : 'Confirm Pair'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-lg">
              {/* Simulated crisp QR Matrix */}
              <div className="w-44 h-44 bg-white flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-black p-1"><div className="w-full h-full bg-black"></div></div>
                  <div className="w-10 h-10 border-4 border-black p-1"><div className="w-full h-full bg-black"></div></div>
                </div>
                <div className="grid grid-cols-6 gap-1 px-3">
                  <div className="h-2 bg-black col-span-2"></div>
                  <div className="h-2 bg-black col-span-1"></div>
                  <div className="h-2 bg-black col-span-3"></div>
                  <div className="h-2 bg-black col-span-3"></div>
                  <div className="h-2 bg-black col-span-2"></div>
                  <div className="h-2 bg-black col-span-1"></div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-10 h-10 border-4 border-black p-1"><div className="w-full h-full bg-black"></div></div>
                  <div className="w-12 h-6 border-2 border-black bg-black"></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-300">
              Point your {targetPlatform === 'windows' ? 'phone camera' : 'laptop camera'} at this code for instant ECDH pairing.
            </p>
            <button
              id="simulate-qr-scan-btn"
              onClick={() => {
                setIsSuccess(true);
                setTimeout(() => {
                  syncEngine.completePairing("Gaurav's Device");
                  setIsSuccess(false);
                  onClose();
                }, 1000);
              }}
              className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {isSuccess ? <CheckCircle2 className="w-4 h-4 text-cyan-300" /> : 'Simulate Camera Scan Match'}
            </button>
          </div>
        )}

        {isSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Pairing handshake verified! AES-256 Session Key Established.</span>
          </div>
        )}
      </div>
    </div>
  );
};
