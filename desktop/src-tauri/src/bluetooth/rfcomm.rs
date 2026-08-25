use crate::crypto::AesCipher;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PacketHeader {
    pub packet_type: u8,
    pub payload_length: u32,
    pub sequence_num: u64,
}

pub struct RfcommSocket {
    pub device_id: String,
    pub is_active: Arc<Mutex<bool>>,
    cipher: Option<Arc<AesCipher>>,
}

impl RfcommSocket {
    pub async fn connect(device_address: &str, shared_secret: Option<&[u8]>) -> Result<Self, String> {
        let cipher = shared_secret.map(|secret| Arc::new(AesCipher::new(secret)));

        Ok(Self {
            device_id: device_address.to_string(),
            is_active: Arc::new(Mutex::new(true)),
            cipher,
        })
    }

    pub async fn send_packet(&self, _packet_type: u8, payload: &[u8]) -> Result<usize, String> {
        let is_connected = *self.is_active.lock().await;
        if !is_connected {
            return Err("Socket is closed".to_string());
        }

        let raw_payload = if let Some(ref cipher) = self.cipher {
            cipher.encrypt(payload)?
        } else {
            payload.to_vec()
        };

        Ok(raw_payload.len() + 8)
    }

    pub async fn process_incoming_packet(&self, _packet_type: u8, data: &[u8]) -> Result<Vec<u8>, String> {
        if let Some(ref cipher) = self.cipher {
            cipher.decrypt(data)
        } else {
            Ok(data.to_vec())
        }
    }

    pub async fn is_connected(&self) -> bool {
        *self.is_active.lock().await
    }
}
