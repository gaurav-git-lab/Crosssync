import React, { useState } from 'react';
import { Code2, Copy, Check, FileCode, FolderTree, Layers, Cpu, Smartphone, Laptop } from 'lucide-react';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('rust_main');
  const [copied, setCopied] = useState(false);

  const files: Record<string, { name: string; path: string; lang: string; category: string; content: string }> = {
    rust_main: {
      name: 'main.rs',
      path: '/desktop/src-tauri/src/main.rs',
      lang: 'rust',
      category: 'Windows (Rust Tauri)',
      content: `// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub platform: String,
    pub is_online: bool,
    pub is_bluetooth_enabled: bool,
    pub ip_address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClipboardPayload {
    pub id: String,
    pub content: String,
    pub source_device_id: String,
    pub source_platform: String,
    pub timestamp: u64,
}

// State container for CrossSync runtime
pub struct AppState {
    pub paired_devices: Mutex<Vec<DeviceInfo>>,
    pub is_sync_enabled: Mutex<bool>,
    pub is_auto_bt_enabled: Mutex<bool>,
    pub last_synced_hash: Mutex<String>,
}

/// Tauri Command: Sync clipboard text to connected Android devices
#[tauri::command]
async fn send_clipboard_event(
    content: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<String, String> {
    println!("[Rust Core] Sending clipboard text event: {} chars", content.len());
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    // Trigger AES-256 encryption and RFCOMM / WebSocket transmission
    Ok(format!("Synced at {}", now))
}

/// Tauri Command: Toggle and trigger auto-Bluetooth radio on Windows via WinRT API
#[tauri::command]
async fn trigger_auto_bluetooth(enable: bool) -> Result<bool, String> {
    println!("[Rust Core] Windows Radio: Requesting Bluetooth state -> {}", enable);
    // In production, invoke Windows.Devices.Radios.Radio API
    Ok(enable)
}

fn main() {
    let state = Arc::new(AppState {
        paired_devices: Mutex::new(vec![DeviceInfo {
            id: "android-pixel-7a".to_string(),
            name: "Gaurav's Pixel 7".to_string(),
            platform: "android".to_string(),
            is_online: true,
            is_bluetooth_enabled: true,
            ip_address: Some("192.168.1.105".to_string()),
        }]),
        is_sync_enabled: Mutex::new(true),
        is_auto_bt_enabled: Mutex::new(true),
        last_synced_hash: Mutex::new(String::new()),
    });

    // System Tray Menu for near-zero CPU background operation
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("status".to_string(), "CrossSync: Connected to Phone").disabled())
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("toggle_sync".to_string(), "Pause Clipboard Sync"))
        .add_item(CustomMenuItem::new("open".to_string(), "Open CrossSync"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit CrossSync"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(state.clone())
        .system_tray(system_tray)
        .invoke_handler(tauri::generate_handler![
            send_clipboard_event,
            trigger_auto_bluetooth,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CrossSync tauri application");
}`
    },
    flutter_main: {
      name: 'main.dart',
      path: '/mobile/lib/main.dart',
      lang: 'dart',
      category: 'Android (Flutter)',
      content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'models/sync_models.dart';
import 'services/bluetooth_sync_service.dart';
import 'services/clipboard_service.dart';
import 'database/sqlite_db.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CrossSyncApp());
}

class CrossSyncApp extends StatelessWidget {
  const CrossSyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CrossSync',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0D1117),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E5FF),
          secondary: Color(0xFF7C4DFF),
          surface: Color(0xFF161B22),
        ),
      ),
      home: const MobileHomeScreen(),
    );
  }
}`
    },
    flutter_clipboard: {
      name: 'clipboard_service.dart',
      path: '/mobile/lib/services/clipboard_service.dart',
      lang: 'dart',
      category: 'Android (Flutter)',
      content: `// Android Clipboard Monitoring and Deduplication Service
import 'dart:async';
import 'package:flutter/services.dart';
import '../models/sync_models.dart';

typedef OnClipboardChangedCallback = void Function(ClipboardItem item);

class ClipboardService {
  static final ClipboardService _instance = ClipboardService._internal();
  factory ClipboardService() => _instance;
  ClipboardService._internal();

  final List<String> _recentRemoteHashes = [];
  OnClipboardChangedCallback? onRemoteSyncNeeded;
  String? _lastLocalHash;

  void startListening(OnClipboardChangedCallback callback) {
    onRemoteSyncNeeded = callback;
    // Periodic check for foreground or connected receiver
    Timer.periodic(const Duration(milliseconds: 600), (timer) async {
      final data = await Clipboard.getData(Clipboard.kTextPlain);
      if (data?.text != null && data!.text!.isNotEmpty) {
        _handleLocalClipboardChange(data.text!);
      }
    });
  }

  void _handleLocalClipboardChange(String text) {
    final hash = ClipboardItem.computeHash(text);
    if (hash == _lastLocalHash) return;
    _lastLocalHash = hash;

    // Deduplicate against remote echoes
    if (_recentRemoteHashes.contains(hash)) return;

    final item = ClipboardItem(
      id: 'clip_\${DateTime.now().millisecondsSinceEpoch}',
      content: text,
      sourceDeviceId: 'android-local',
      sourcePlatform: 'android',
      timestamp: DateTime.now().millisecondsSinceEpoch,
      contentHash: hash,
    );

    onRemoteSyncNeeded?.call(item);
  }
}`
    },
    protocol_md: {
      name: 'PROTOCOL.md',
      path: '/docs/PROTOCOL.md',
      lang: 'markdown',
      category: 'Protocol Contract',
      content: `# CrossSync Wire Protocol Specification (v1.0)

## Framing Format
+---------------+----------------+----------------------+--------------------+--------------------+
| Magic (0x58)  | MsgType (1 B)  | Payload Len (4 B)    | IV / Nonce (12 B)  | Encrypted Body (N) |
+---------------+----------------+----------------------+--------------------+--------------------+

Message Types:
- 0x02: PAIR_REQUEST
- 0x04: PAIR_CONFIRM
- 0x10: CLIPBOARD_SYNC_EVENT
- 0x20: FILE_TRANSFER_INIT
- 0x23: FILE_TRANSFER_CHUNK
- 0x25: FILE_TRANSFER_COMPLETE
- 0x30: AUTO_BT_TRIGGER`
    },
    schema_sql: {
      name: 'schema.sql',
      path: '/shared/schema.sql',
      lang: 'sql',
      category: 'Database Schema',
      content: `CREATE TABLE IF NOT EXISTS paired_devices (
    id TEXT PRIMARY KEY,
    device_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    public_key TEXT NOT NULL,
    shared_secret_encrypted TEXT,
    paired_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    is_trusted INTEGER NOT NULL DEFAULT 1,
    bluetooth_mac TEXT,
    ip_address TEXT,
    is_online INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clipboard_history (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text/plain',
    source_device_id TEXT NOT NULL,
    source_platform TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    content_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transfer_history (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    status TEXT NOT NULL,
    speed_bytes_per_sec INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER
);`
    },
    build_guide: {
      name: 'NATIVE_BUILD_GUIDE.md',
      path: '/docs/NATIVE_BUILD_GUIDE.md',
      lang: 'markdown',
      category: 'Build & Download (.exe / .apk)',
      content: `# CrossSync Native Compilation & Build Commands

## 1. Windows Desktop Installer (.exe / .msi)
cd desktop
npm install
npm run tauri build

Output Locations:
- MSI: desktop/src-tauri/target/release/bundle/msi/CrossSync_1.0.0_x64_en-US.msi
- NSIS Setup: desktop/src-tauri/target/release/bundle/nsis/CrossSync_1.0.0_x64-setup.exe
- Standalone: desktop/src-tauri/target/release/crosssync-desktop.exe

## 2. Android Mobile App (.apk)
cd mobile
flutter pub get
flutter build apk --release

Output Location:
- APK: mobile/build/app/outputs/flutter-apk/app-release.apk

Install via ADB:
adb install mobile/build/app/outputs/flutter-apk/app-release.apk`
    }
  };

  const current = files[selectedFile] || files.rust_main;

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="code-explorer-view" className="h-full flex flex-col glass-panel rounded-2xl p-5 overflow-hidden border border-white/10 text-white select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Cross-Platform Architecture & Code Explorer</h3>
            <p className="text-xs text-gray-400">Windows (Tauri/Rust) • Android (Flutter/Dart) • Shared Protocol</p>
          </div>
        </div>

        <button
          id="copy-code-btn"
          onClick={handleCopy}
          className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Source' : 'Copy File Content'}</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 min-h-0 overflow-hidden">
        
        {/* File Navigator Sidebar */}
        <div className="md:col-span-4 flex flex-col gap-2 overflow-y-auto pr-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Project Architecture
          </span>

          {Object.entries(files).map(([key, f]) => (
            <button
              key={key}
              id={`file-tab-${key}`}
              onClick={() => setSelectedFile(key)}
              className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                selectedFile === key
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                  : 'bg-black/20 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileCode className="w-4 h-4 shrink-0 text-cyan-400" />
                <div className="truncate">
                  <div className="text-xs font-medium text-gray-200 truncate">{f.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{f.path}</div>
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-gray-400 font-mono">
                {f.lang}
              </span>
            </button>
          ))}
        </div>

        {/* Code Content Viewer */}
        <div className="md:col-span-8 flex flex-col rounded-xl bg-[#090D16] border border-white/10 overflow-hidden">
          <div className="px-4 py-2 bg-black/60 border-b border-white/10 flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="text-cyan-400 font-semibold">{current.path}</span>
            <span>{current.category}</span>
          </div>
          <div className="flex-1 p-4 overflow-auto font-mono text-xs text-gray-300 leading-relaxed">
            <pre className="whitespace-pre">{current.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
