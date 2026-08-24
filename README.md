# CrossSync ⚡

**CrossSync** is an ultra-fast, peer-to-peer file, image, and clipboard synchronization bridge between **Windows (Tauri + Rust + React)** and **Android (Flutter)** with zero cloud dependency, hardware-accelerated AES-256-GCM encryption, and event-driven background service execution.

---

## 🌟 Key Features

### 1. Instant Bidirectional Clipboard Sync
- **Mobile to Laptop:** Copy text/links/images on your Android phone → Press `Ctrl + V` on Windows to paste instantly.
- **Laptop to Mobile:** Copy text on Windows → Tap Paste on Android.
- **Loopback Suppression:** Hardware-efficient SHA-256 deduplication prevents recursive clipboard ping-pong.

### 2. Auto-Bluetooth Radio Activation
- When you send a file, CrossSync checks Bluetooth adapter state and automatically triggers radio activation on both devices.
- Uses Windows WinRT Radios API on desktop and Android BluetoothManager on mobile.

### 3. Liquid-Glass UI Theme
- Beautiful frosted acrylic glassmorphism layout with live transfer graphs, magnetic drag-and-drop targets, and dark/light modes.

### 4. Background Service (<0.05% CPU / <0.2% Battery/hr)
- **Windows:** Native Win32 `AddClipboardFormatListener` and System Tray minimization.
- **Android:** Foreground service with sticky notification channel and immediate wake-lock release.

### 5. Multi-Transport & AES-256 Security
- Primary: Bluetooth 5.0+ RFCOMM stream.
- Secondary: Local LAN WebSocket (`52849`) fallback.
- End-to-end encrypted with ECDH P-256 key exchange + AES-256-GCM cipher.

---

## 📁 Repository Structure

```
crosssync/
├── desktop/                  # Tauri + React + Rust Windows Desktop Client
│   ├── src-tauri/
│   │   ├── Cargo.toml        # Rust dependencies (arboard, rusqlite, aes-gcm, windows)
│   │   ├── tauri.conf.json   # Tauri configuration, tray & window specs
│   │   └── src/main.rs       # Native Rust sync engine, tray, and clipboard hooks
├── mobile/                   # Android Flutter Mobile Client
│   ├── pubspec.yaml          # Flutter dependencies (sqflite, flutter_bluetooth_serial)
│   └── lib/
│       ├── main.dart         # Flutter UI with Material Glass theme
│       ├── models/           # Data models (sync_models.dart)
│       ├── services/         # Bluetooth RFCOMM & Clipboard listener services
│       └── database/         # SQLite database client
├── shared/                   # Shared Cross-Platform Protocol & Schemas
│   ├── protocol.ts           # Wire protocol types, message framing & crypto helpers
│   └── schema.sql            # SQLite database schema for devices, clips & transfers
├── docs/
│   ├── PROTOCOL.md           # Wire format, byte layout, handshake & packet framing
│   └── PROJECT_SPEC.md       # Architecture spec, power budgets & benchmarks
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ & **npm**
- **Rust & Cargo** (for Windows Tauri compilation)
- **Flutter SDK** v3.0+ & **Android Studio**

### Running the Interactive CrossSync Simulator
```bash
npm install
npm run dev
```

### Building Windows Desktop Client (Tauri)
```bash
cd desktop
npm install
npm run tauri build
```

### Building Android Mobile Client (Flutter)
```bash
cd mobile
flutter pub get
flutter build apk --release
```

---

## 🔒 Security Architecture

All transfers over Bluetooth or Wi-Fi WebSocket are wrapped in an AES-256-GCM authenticated cipher envelope with random 96-bit nonces. No data ever touches third-party servers.
