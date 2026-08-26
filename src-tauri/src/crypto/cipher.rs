use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce as AesNonce,
};
use hmac::{Hmac, Mac};
use sha2::Sha256;

pub struct CipherEngine {
    key: [u8; 32],
}

impl CipherEngine {
    pub fn new(key: [u8; 32]) -> Self {
        Self { key }
    }

    /// Encrypt plaintext with AES-256-GCM
    /// Returns: nonce (12 bytes) + ciphertext + tag
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, String> {
        use rand::RngCore;

        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|_| "Invalid key size".to_string())?;

        // Generate random 96-bit (12-byte) nonce
        let mut nonce_bytes = [0u8; 12];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);

        // Use concrete type annotation here
        let nonce = AesNonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| format!("Encryption failed: {}", e))?;

        // Return: nonce + ciphertext (includes authentication tag)
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&ciphertext);
        Ok(result)
    }

    /// Decrypt ciphertext with embedded nonce
    /// Input format: nonce (12 bytes) + ciphertext + tag
    pub fn decrypt(&self, ciphertext_with_nonce: &[u8]) -> Result<Vec<u8>, String> {
        if ciphertext_with_nonce.len() < 12 {
            return Err("Ciphertext too short (need at least 12 bytes for nonce)".to_string());
        }

        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|_| "Invalid key size".to_string())?;

        // Extract nonce (first 12 bytes)
        let nonce = AesNonce::from_slice(&ciphertext_with_nonce[..12]);

        // Decrypt remaining bytes
        let plaintext = cipher
            .decrypt(nonce, &ciphertext_with_nonce[12..])
            .map_err(|e| format!("Decryption failed: {}", e))?;

        Ok(plaintext)
    }

    /// Generate HMAC-SHA256 for integrity verification
    pub fn hmac(&self, data: &[u8]) -> Vec<u8> {
        let mut mac = <Hmac<Sha256> as KeyInit>::new_from_slice(&self.key)
            .expect("HMAC key initialization failed");
        mac.update(data);
        mac.finalize().into_bytes().to_vec()
    }

    /// Verify HMAC-SHA256
    pub fn verify_hmac(&self, data: &[u8], expected_mac: &[u8]) -> bool {
        let mut mac = <Hmac<Sha256> as KeyInit>::new_from_slice(&self.key)
            .expect("HMAC key initialization failed");
        mac.update(data);
        mac.verify_slice(expected_mac).is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = [42u8; 32];
        let engine = CipherEngine::new(key);
        let plaintext = b"Hello, CrossSync!";

        let encrypted = engine.encrypt(plaintext).expect("Encryption failed");
        let decrypted = engine.decrypt(&encrypted).expect("Decryption failed");

        assert_eq!(plaintext, decrypted.as_slice());
    }

    #[test]
    fn test_hmac_verification() {
        let key = [42u8; 32];
        let engine = CipherEngine::new(key);
        let data = b"Test data for HMAC";

        let mac = engine.hmac(data);
        assert!(engine.verify_hmac(data, &mac));
    }
}
