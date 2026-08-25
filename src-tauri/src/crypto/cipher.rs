use aes_gcm::{
    aead::{Aead, KeyInit, Nonce},
    Aes256Gcm,
};
use hmac::{Hmac, Mac};
use rand::Rng;
use sha2::{Digest, Sha256};

pub struct AesCipher {
    key: [u8; 32],
}

impl AesCipher {
    /// Create cipher from a shared secret key/passphrase
    pub fn new(shared_secret: &[u8]) -> Self {
        let mut key = [0u8; 32];
        let mut hasher = Sha256::new();
        hasher.update(shared_secret);
        key.copy_from_slice(&hasher.finalize()[..]);
        Self { key }
    }

    /// Encrypt plaintext data using AES-256-GCM
    /// Output format: [12-byte Nonce | Ciphertext | 16-byte Auth Tag]
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, String> {
        let cipher = Aes256Gcm::new((&self.key).into());
        let mut rng = rand::thread_rng();
        let nonce: [u8; 12] = rng.gen();

        let ciphertext = cipher
            .encrypt(Nonce::from_slice(&nonce), plaintext)
            .map_err(|e| format!("Encryption error: {:?}", e))?;

        let mut result = nonce.to_vec();
        result.extend_from_slice(&ciphertext);
        Ok(result)
    }

    /// Decrypt data payload that contains [12-byte Nonce | Ciphertext + Tag]
    pub fn decrypt(&self, ciphertext_with_nonce: &[u8]) -> Result<Vec<u8>, String> {
        if ciphertext_with_nonce.len() < 12 {
            return Err("Ciphertext too short: missing 12-byte IV/nonce".to_string());
        }

        let cipher = Aes256Gcm::new((&self.key).into());
        let nonce = Nonce::from_slice(&ciphertext_with_nonce[..12]);
        let ciphertext = &ciphertext_with_nonce[12..];

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| format!("Decryption authentication failed: {:?}", e))?;

        Ok(plaintext)
    }

    /// Sign data using HMAC-SHA256
    pub fn sign(&self, data: &[u8]) -> Vec<u8> {
        let mut mac = Hmac::<Sha256>::new_from_slice(&self.key)
            .expect("HMAC accepts 256-bit keys");
        mac.update(data);
        mac.finalize().into_bytes().to_vec()
    }

    /// Verify HMAC-SHA256 signature
    pub fn verify_signature(&self, data: &[u8], signature: &[u8]) -> bool {
        let expected = self.sign(data);
        expected == signature
    }
}
