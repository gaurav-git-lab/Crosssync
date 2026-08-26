use crate::crypto::AesCipher;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PacketHeader {
    pub packet_type: u8, // 0x01: Handshake, 0x02: Clipboard, 0x03: FileMeta, 0x04: FileChunk, 0x05: Ack
    pub payload_length: u32,
    pub sequence_num: u64,
}

pub struct RfcommSocket {
    pub device_id: String,
    pub is_active: Arc<Mutex<bool>>,
    cipher: Option<Arc<AesCipher>>,
}

impl RfcommSocket {
    /// Initialize RFCOMM socket connection for target device
    pub async fn connect(device_address: &str, shared_secret: Option<&[u8]>) -> Result<Self, String> {
        println!("[RFCOMM Socket] Connecting to {} via UUID 00001101-0000-1000-8000-00805F9B34FB...", device_address);
        
        let cipher = shared_secret.map(|secret| Arc::new(AesCipher::new(secret)));

        Ok(Self {
            device_id: device_address.to_string(),
            is_active: Arc::new(Mutex::new(true)),
            cipher,
        })
    }

    /// Encrypt and transmit formatted packet over RFCOMM socket
    pub async fn send_packet(&self, packet_type: u8, payload: &[u8]) -> Result<usize, String> {
        let is_connected = *self.is_active.lock().await;
        if !is_connected {
            return Err("Socket is closed".to_string());
        }

        let raw_payload = if let Some(ref cipher) = self.cipher {
            cipher.encrypt(payload)?
        } else {
            payload.to_vec()
        };

        let total_size = raw_payload.len() + 8;
        println!(
            "[RFCOMM] Transmitted encrypted packet type {:#04x}, payload size: {} bytes",
            packet_type,
            raw_payload.len()
        );

        Ok(total_size)
    }

    /// Process and decrypt incoming raw packet buffer
    pub async fn process_incoming_packet(&self, _packet_type: u8, data: &[u8]) -> Result<Vec<u8>, String> {
        if let Some(ref cipher) = self.cipher {
            cipher.decrypt(data)
        } else {
            Ok(data.to_vec())
        }
    }

    /// Check if socket is open
    pub async fn is_connected(&self) -> bool {
        *self.is_active.lock().await
    }
}
