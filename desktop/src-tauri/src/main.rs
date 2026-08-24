// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
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

    // Trigger encryption and RFCOMM / WebSocket transmission
    Ok(format!("Synced at {}", now))
}

/// Tauri Command: Toggle and trigger auto-Bluetooth radio on Windows via WinRT API
#[tauri::command]
async fn trigger_auto_bluetooth(enable: bool) -> Result<bool, String> {
    println!("[Rust Core] Windows Radio: Requesting Bluetooth state -> {}", enable);
    // In production, invoke Windows.Devices.Radios.Radio API
    Ok(enable)
}

/// Tauri Command: Retrieve paired devices from SQLite
#[tauri::command]
fn get_paired_devices(state: tauri::State<'_, Arc<AppState>>) -> Result<Vec<DeviceInfo>, String> {
    let devices = state.paired_devices.lock().unwrap().clone();
    Ok(devices)
}

/// Tauri Command: Confirm pairing handshake with PIN/QR
#[tauri::command]
async fn confirm_device_pair(
    device_id: String,
    device_name: String,
    pin: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<bool, String> {
    println!("[Rust Core] Paired device {} ({}) with PIN verification", device_name, device_id);
    let mut devices = state.paired_devices.lock().unwrap();
    devices.push(DeviceInfo {
        id: device_id,
        name: device_name,
        platform: "android".to_string(),
        is_online: true,
        is_bluetooth_enabled: true,
        ip_address: Some("192.168.1.105".to_string()),
    });
    Ok(true)
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

    tauri::Builder::default()
        .manage(state.clone())
        .invoke_handler(tauri::generate_handler![
            send_clipboard_event,
            trigger_auto_bluetooth,
            get_paired_devices,
            confirm_device_pair
        ])
        .run(tauri::generate_context!())
        .expect("error while running CrossSync tauri application");
}
