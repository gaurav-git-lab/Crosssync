import React, { useState, useEffect, useId } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldCheck, 
  Camera, 
  Smartphone, 
  Laptop, 
  X, 
  Sparkles, 
  KeyRound, 
  Clock, 
  Radio, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { sounds } from '../services/soundEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPlatform?: 'windows' | 'android';
}

interface PairingPayload {
  protocol: 'crosssync-v1';
  deviceId: string;
  deviceName: string;
  platform: 'windows' | 'android';
  nonce: string;
  sessionToken: string;
  ecdhKeyFingerprint: string;
  bluetoothUuid: string;
  lanIp: string;
  lanPort: number;
  timestamp: number;
  expiresInSeconds: number;
}

export const QrPairingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialPlatform = 'windows',
}) => {
  const [platform, setPlatform] = useState<'windows' | 'android'>(initialPlatform);
  const [timeLeft, setTimeLeft] = useState(60);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [showPayloadInspector, setShowPayloadInspector] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState(false);
  const [backupPin, setBackupPin] = useState('739 481');
  const [activeMode, setActiveMode] = useState<'qr' | 'pin'>('qr');
  const [pinInput, setPinInput] = useState('');

  // Generate unique dynamic pairing state
  const [payload, setPayload] = useState<PairingPayload>(() => generateNewPayload(initialPlatform as 'windows' | 'android'));

  function generateRandomHex(length: number): string {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function generateNewPayload(targetPlat: 'windows' | 'android'): PairingPayload {
    const isWin = targetPlat === 'windows';
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    setBackupPin(`${p1} ${p2}`);

    return {
      protocol: 'crosssync-v1',
      deviceId: isWin ? `win-thinkpad-${generateRandomHex(4).toLowerCase()}` : `android-pixel-${generateRandomHex(4).toLowerCase()}`,
      deviceName: isWin ? "Gaurav's ThinkPad X1" : "Gaurav's Pixel 7",
      platform: targetPlat,
      nonce: generateRandomHex(16),
      sessionToken: generateRandomHex(32),
      ecdhKeyFingerprint: `SHA256:${generateRandomHex(8)}:${generateRandomHex(8)}:${generateRandomHex(8)}`,
      bluetoothUuid: '7A91D0E0-4E38-40F4-8E82-9B9D8B6D1B20',
      lanIp: isWin ? '192.168.1.142' : '192.168.1.189',
      lanPort: 52849,
      timestamp: Date.now(),
      expiresInSeconds: 60,
    };
  }

  const handleRegenerate = () => {
    sounds.playFileStart();
    setPayload(generateNewPayload(platform));
    setTimeLeft(60);
  };

  const handleSwitchPlatform = (newPlatform: 'windows' | 'android') => {
    setPlatform(newPlatform);
    setPayload(generateNewPayload(newPlatform));
    setTimeLeft(60);
  };

  // 60-second countdown timer for cryptographic freshness
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto regenerate on expiry for high security
          setPayload(generateNewPayload(platform));
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, platform]);

  if (!isOpen) return null;

  const rawJsonString = JSON.stringify(payload);
  const deepLinkUri = `crosssync://pair?v=1&device=${encodeURIComponent(payload.deviceName)}&token=${payload.sessionToken}&nonce=${payload.nonce}&fp=${encodeURIComponent(payload.ecdhKeyFingerprint)}`;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(rawJsonString);
    setCopiedPayload(true);
    sounds.playFileStart();
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleCopyUri = () => {
    navigator.clipboard.writeText(deepLinkUri);
    setCopiedUri(true);
    sounds.playFileStart();
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    sounds.playFileStart();

    setTimeout(() => {
      setIsScanning(false);
      setPairingSuccess(true);
      sounds.playTransferComplete();
      syncEngine.completePairing(platform === 'windows' ? "Gaurav's Pixel 7 (Paired via QR)" : "Gaurav's ThinkPad X1 (Paired via QR)");

      setTimeout(() => {
        setPairingSuccess(false);
        onClose();
      }, 1400);
    }, 1200);
  };

  const handleVerifyPin = () => {
    if (pinInput.replace(/\s/g, '').length >= 4) {
      setPairingSuccess(true);
      sounds.playTransferComplete();
      syncEngine.completePairing(platform === 'windows' ? "Gaurav's Pixel 7" : "Gaurav's ThinkPad X1");
      setTimeout(() => {
        setPairingSuccess(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div 
      id="qr-pairing-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="qr-pairing-modal-dialog" 
        className="relative w-full max-w-lg bg-[#0C111C]/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,229,255,0.15)] backdrop-blur-2xl text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="qr-pairing-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
            <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center text-cyan-300">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Instant QR Code Pairing</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Zero-Config
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Scan with camera for instant ECDH P-256 key exchange & AES-256 E2EE handshake
            </p>
          </div>
        </div>

        {/* Mode & Platform Selector */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          {/* Target Host Device Tabs */}
          <div className="flex-1 flex bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              id="qr-host-windows-btn"
              onClick={() => handleSwitchPlatform('windows')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                platform === 'windows'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Windows Host
            </button>
            <button
              id="qr-host-android-btn"
              onClick={() => handleSwitchPlatform('android')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                platform === 'android'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Android Host
            </button>
          </div>

          {/* QR vs Backup PIN selector */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              id="qr-view-mode-qr-btn"
              onClick={() => setActiveMode('qr')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'qr'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> QR
            </button>
            <button
              id="qr-view-mode-pin-btn"
              onClick={() => setActiveMode('pin')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'pin'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> PIN
            </button>
          </div>
        </div>

        {activeMode === 'qr' ? (
          <div className="flex flex-col items-center">
            
            {/* Real SVG QR Code Container with High Contrast & Scanner Overlay */}
            <div className="relative p-5 sm:p-6 bg-white rounded-3xl shadow-[0_0_30px_rgba(0,229,255,0.2)] border-2 border-cyan-400/40 group">
              
              {/* Dynamic QR Code */}
              <div className="relative flex items-center justify-center">
                <QRCodeSVG
                  value={rawJsonString}
                  size={210}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#0A0E17"
                  imageSettings={{
                    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300E5FF"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
                    x: undefined,
                    y: undefined,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />

                {/* Animated Scanning Laser Beam Effect */}
                {isScanning && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                    <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00E5FF] animate-[scan_1.2s_ease-in-out_infinite]" />
                  </div>
                )}
              </div>

              {/* Corner Targeting Reticles */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 rounded-tl" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500 rounded-tr" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500 rounded-bl" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 rounded-br" />
            </div>

            {/* Instruction Banner */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-300 font-medium">
                Point your {platform === 'windows' ? 'Android camera or CrossSync app' : 'Windows webcam'} at this QR code.
              </p>
              <div className="mt-1 flex items-center justify-center gap-3 text-[11px] text-gray-400 font-mono">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> Nonce: {payload.nonce.slice(0, 6)}...
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <Clock className="w-3 h-3 text-cyan-400" /> Expires in {timeLeft}s
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="w-full mt-4 flex flex-col sm:flex-row gap-2">
              <button
                id="simulate-instant-qr-scan-btn"
                onClick={handleSimulateScan}
                disabled={isScanning || pairingSuccess}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
              >
                {pairingSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Paired Successfully!</span>
                  </>
                ) : isScanning ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-black" />
                    <span>Scanning & Exchanging Keys...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Simulate Instant Camera Scan</span>
                  </>
                )}
              </button>

              <button
                id="regenerate-qr-code-btn"
                onClick={handleRegenerate}
                className="py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-gray-300 hover:text-cyan-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                title="Regenerate Unique Cryptographic Payload"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New QR</span>
              </button>
            </div>

            {/* Copy Payload & Deep Link Options */}
            <div className="w-full mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-white/5">
              <button
                id="copy-qr-json-btn"
                onClick={handleCopyPayload}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-cyan-300 font-mono transition-colors"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'JSON Copied' : 'Copy Payload JSON'}</span>
              </button>

              <button
                id="copy-qr-uri-btn"
                onClick={handleCopyUri}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-cyan-300 font-mono transition-colors"
              >
                {copiedUri ? <Check className="w-3 h-3 text-emerald-400" /> : <ExternalLink className="w-3 h-3" />}
                <span>{copiedUri ? 'URI Copied' : 'Copy Deep Link URI'}</span>
              </button>

              <button
                id="toggle-payload-inspector-btn"
                onClick={() => setShowPayloadInspector(!showPayloadInspector)}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-mono"
              >
                <span>{showPayloadInspector ? 'Hide Data' : 'Inspect'}</span>
                {showPayloadInspector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Collapsible Cryptographic Payload Inspector */}
            {showPayloadInspector && (
              <div id="qr-payload-inspector" className="w-full mt-3 p-3 rounded-xl bg-black/50 border border-cyan-500/20 text-[11px] font-mono text-gray-300 space-y-1">
                <div className="text-cyan-300 font-bold flex items-center justify-between text-[10px]">
                  <span>PAIRING_HANDSHAKE_PACKET</span>
                  <span className="text-emerald-400">ECDH_SECP256R1</span>
                </div>
                <div className="truncate"><span className="text-gray-500">Device:</span> {payload.deviceName} ({payload.deviceId})</div>
                <div className="truncate"><span className="text-gray-500">Key Fingerprint:</span> {payload.ecdhKeyFingerprint}</div>
                <div className="truncate"><span className="text-gray-500">Session Nonce:</span> {payload.nonce}</div>
                <div className="truncate"><span className="text-gray-500">Transport:</span> BT {payload.bluetoothUuid.slice(0, 8)}... | IP {payload.lanIp}:{payload.lanPort}</div>
              </div>
            )}

          </div>
        ) : (
          /* Numeric Backup PIN Tab */
          <div className="flex flex-col items-center text-center space-y-4 py-2">
            <p className="text-xs text-gray-300">
              If camera scanning is unavailable, enter this 6-digit numeric pairing PIN on your peer device:
            </p>

            <div className="flex items-center gap-3 bg-black/40 border border-cyan-500/40 px-6 py-3 rounded-2xl shadow-inner">
              <span className="text-3xl font-mono font-bold tracking-widest text-cyan-300">{backupPin}</span>
              <button
                id="refresh-backup-pin-btn"
                onClick={handleRegenerate}
                title="Generate new PIN"
                className="p-1.5 text-gray-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full pt-2">
              <label className="block text-left text-xs font-medium text-gray-400 mb-1.5">
                Simulate peer device PIN entry:
              </label>
              <div className="flex gap-2">
                <input
                  id="qr-modal-pin-input"
                  type="text"
                  placeholder={`Enter ${backupPin}`}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-cyan-500 text-white"
                />
                <button
                  id="qr-modal-verify-pin-btn"
                  onClick={handleVerifyPin}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  {pairingSuccess ? <CheckCircle2 className="w-4 h-4 text-black" /> : 'Confirm Pair'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
