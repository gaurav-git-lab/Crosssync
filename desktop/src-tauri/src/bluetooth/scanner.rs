use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredDevice {
    pub device_id: String,
    pub name: String,
    pub bluetooth_address: String,
    pub is_paired: bool,
    pub can_pair: bool,
    pub device_type: String,
    pub rssi: Option<i32>,
    pub gatt_services: Vec<String>,
}

pub struct BluetoothScanner;

impl BluetoothScanner {
    pub async fn scan_devices() -> Result<Vec<DiscoveredDevice>, String> {
        let mut devices = Vec::new();
        devices.push(DiscoveredDevice {
            device_id: "android-pixel-7a".to_string(),
            name: "Gaurav's Pixel 7".to_string(),
            bluetooth_address: "A4:C3:F0:89:12:34".to_string(),
            is_paired: true,
            can_pair: true,
            device_type: "Smartphone (Android 14)".to_string(),
            rssi: Some(-54),
            gatt_services: vec![
                "00001101-0000-1000-8000-00805F9B34FB".to_string(),
                "0000FEF0-0000-1000-8000-00805F9B34FB".to_string(),
            ],
        });

        devices.push(DiscoveredDevice {
            device_id: "android-galaxy-tab".to_string(),
            name: "Galaxy Tab S9+".to_string(),
            bluetooth_address: "B8:27:EB:41:88:99".to_string(),
            is_paired: false,
            can_pair: true,
            device_type: "Tablet (Android 14)".to_string(),
            rssi: Some(-68),
            gatt_services: vec!["00001101-0000-1000-8000-00805F9B34FB".to_string()],
        });

        Ok(devices)
    }

    pub async fn get_paired_devices() -> Result<Vec<DiscoveredDevice>, String> {
        let devices = vec![DiscoveredDevice {
            device_id: "android-pixel-7a".to_string(),
            name: "Gaurav's Pixel 7".to_string(),
            bluetooth_address: "A4:C3:F0:89:12:34".to_string(),
            is_paired: true,
            can_pair: true,
            device_type: "Smartphone (Android 14)".to_string(),
            rssi: Some(-52),
            gatt_services: vec!["00001101-0000-1000-8000-00805F9B34FB".to_string()],
        }];
        Ok(devices)
    }

    pub async fn connect_device(_device_id: &str) -> Result<bool, String> {
        Ok(true)
    }
}
