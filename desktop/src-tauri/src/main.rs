// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod bluetooth;
pub mod clipboard;
pub mod commands;
pub mod crypto;
pub mod db;
pub mod file;

use clipboard::ClipboardListener;
use db::DatabaseManager;
use file::FileTransferEngine;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::Manager;

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

pub struct AppState {
    pub paired_devices: Mutex<Vec<DeviceInfo>>,
    pub is_sync_enabled: Mutex<bool>,
    pub is_auto_bt_enabled: Mutex<bool>,
    pub last_synced_hash: Mutex<String>,
    pub db: DatabaseManager,
    pub clipboard_listener: ClipboardListener,
    pub file_engine: FileTransferEngine,
}

fn main() {
    let db = DatabaseManager::new().expect("Failed to initialize SQLite database");
    let clipboard_listener = ClipboardListener::new();
    let file_engine = FileTransferEngine::new();

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
        db,
        clipboard_listener,
        file_engine,
    });

    tauri::Builder::default()
        .manage(state.clone())
        .invoke_handler(tauri::generate_handler![
            commands::bluetooth::scan_bluetooth_devices,
            commands::bluetooth::get_paired_bluetooth_devices,
            commands::bluetooth::pair_bluetooth_device,
            commands::bluetooth::trigger_auto_bluetooth,
            commands::clipboard::send_clipboard_event,
            commands::clipboard::set_system_clipboard,
            commands::clipboard::get_clipboard_history,
            commands::file::prepare_file_transfer,
            commands::file::receive_file_chunk,
            commands::file::finalize_received_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CrossSync Tauri application");
}
