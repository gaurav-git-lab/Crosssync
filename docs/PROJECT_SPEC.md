# CrossSync Project Specification & Architectural Blueprint

## 1. System Overview

**CrossSync** is an ultra-low latency, peer-to-peer file and clipboard synchronization bridge between Windows 11/10 and Android devices. It functions without reliance on external cloud servers, guaranteeing zero data leakage, maximum privacy, and near-instantaneous transfers.

```
+------------------------------------+                +------------------------------------+
|         Windows Desktop            |                |          Android Mobile            |
|       (Tauri + Rust Backend)       |                |          (Flutter Engine)          |
|                                    |                |                                    |
| +--------------------------------+ |                | +--------------------------------+ |
| | Liquid-Glass Acrylic UI (React)| |                | | Material Glass 3 UI (Flutter)  | |
| +--------------------------------+ |                | +--------------------------------+ |
|                 |                  |                |                 |                  |
| +--------------------------------+ |                | +--------------------------------+ |
| | Rust Tauri Core & Background   | |    Bluetooth   | | Android Foreground Service     | |
| | - AddClipboardFormatListener   | |<=============> | | - OnPrimaryClipChangedListener | |
| | - RFCOMM Bluetooth 5.0 Stack   | |    RFCOMM /    | | - Flutter Bluetooth Serial     | |
| | - AES-256-GCM Engine           | |    Local LAN   | | - AES-256-GCM Java/Dart Engine | |
| | - SQLite Embedded DB           | |   (WebSocket)  | | - Sqflite Local Storage        | |
| +--------------------------------+ |                | +--------------------------------+ |
+------------------------------------+                +------------------------------------+
```

---

## 2. Core Functional Modules

### 2.1 Instant Clipboard Synchronization
- Bidirectional text, formatted HTML, URLs, and image bitmaps.
- Event-driven OS hooks (`AddClipboardFormatListener` in Win32, `ClipboardManager.OnPrimaryClipChangedListener` in Android).
- Sub-50ms sync latency over LAN and sub-120ms over Bluetooth RFCOMM.
- Deduplication and loopback suppression via rolling SHA-256 LRU cache.

### 2.2 Auto-Bluetooth On-Demand
- When user initiates a file or image send, if Bluetooth is disabled on the host, the app invokes native platform API to activate Bluetooth adapter without manual user menu navigation:
  - Windows: `Windows.Devices.Radios.Radio.SetStateAsync(RadioState.On)`
  - Android: `BluetoothAdapter.getDefaultAdapter().enable()` with runtime permission flow.

### 2.3 Fluid Liquid-Glassmorphism UI
- Dynamic frosted acrylic backdrops (`backdrop-filter: blur(24px)`).
- Visual connection status indicators (pulsing aurora glow).
- Real-time speedometer gauge and streaming transfer speed chart (MB/s).
- Instant drag-and-drop targets with magnetic hover highlights.
- Dual-theme support: Midnight Liquid (Dark) & Frosted Opal (Light).

### 2.4 Security & Privacy Architecture
- Zero cloud relay: direct peer-to-peer over RFCOMM and local subnet.
- Cryptographic handshake using ECDH P-256 and AES-256-GCM authenticated encryption.
- 6-digit numeric PIN confirmation or high-entropy QR code pairing.
- Automatic session termination and key rotation upon prolonged inactivity.

---

## 3. Power Consumption Budget & Benchmarks

| State | Target Windows CPU | Target Android Battery Draw | Mechanism |
|---|---|---|---|
| **Background Idle** | < 0.05% CPU | < 0.2% battery/hr | Win32 message loop / Android dormant foreground listener |
| **Clipboard Sync** | < 0.2% burst | < 0.01% burst | Single 1KB packet transmission, instant sleep return |
| **Active 100MB File Send** | ~1.5% CPU (AES-NI) | ~1.2% total transfer cost | Stream buffer 64KB chunks with hardware AES-NI acceleration |

---

## 4. SQLite Database Schema Blueprint

### 4.1 `paired_devices`
Stores cryptographic credentials and transport metadata of authorized devices.

### 4.2 `clipboard_history`
Stores searchable clipboard entries with content previews, pinning, and auto-cleanup rules.

### 4.3 `transfer_history`
Maintains records of all sent and received files, thumbnails, hashes, speeds, and status.

### 4.4 `app_settings`
Stores user preferences (auto-Bluetooth, default download directories, retention duration, encryption level).
