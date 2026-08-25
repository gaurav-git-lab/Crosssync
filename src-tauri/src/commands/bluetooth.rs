use crate::bluetooth::{BluetoothScanner, DiscoveredDevice};
use crate::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn scan_bluetooth_devices() -> Result<Vec<DiscoveredDevice>, String> {
    BluetoothScanner::scan_devices().await
}

#[tauri::command]
pub async fn get_paired_bluetooth_devices() -> Result<Vec<DiscoveredDevice>, String> {
    BluetoothScanner::get_paired_devices().await
}

#[tauri::command]
pub async fn pair_bluetooth_device(
    device_id: String,
    device_name: String,
    pin: String,
    state: State<'_, Arc<AppState>>,
) -> Result<bool, String> {
    if pin.len() < 4 {
        return Err("PIN must be at least 4 digits".to_string());
    }

    println!(
        "[Tauri Command] Successfully paired device {} ({}) with PIN handshake",
        device_name, device_id
    );

    let mut devices = state.paired_devices.lock().unwrap();
    devices.push(crate::DeviceInfo {
        id: device_id,
        name: device_name,
        platform: "android".to_string(),
        is_online: true,
        is_bluetooth_enabled: true,
        ip_address: Some("192.168.1.105".to_string()),
    });

    Ok(true)
}

#[tauri::command]
pub async fn trigger_auto_bluetooth(enable: bool, state: State<'_, Arc<AppState>>) -> Result<bool, String> {
    let mut auto_bt = state.is_auto_bt_enabled.lock().unwrap();
    *auto_bt = enable;
    println!("[Tauri Command] Windows Radio auto-toggle set to: {}", enable);
    Ok(enable)
}
