use crc32fast::Hasher as Crc32Hasher;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use tokio::fs::{self, File};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetaInfo {
    pub transfer_id: String,
    pub file_name: String,
    pub file_size: u64,
    pub total_chunks: u32,
    pub chunk_size: u32,
    pub file_hash_sha256: String,
    pub mime_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChunkInfo {
    pub transfer_id: String,
    pub chunk_index: u32,
    pub data: Vec<u8>,
    pub crc32: u32,
    pub is_last: bool,
}

pub struct FileTransferEngine {
    staging_dir: PathBuf,
    downloads_dir: PathBuf,
    chunk_size: usize,
}

impl FileTransferEngine {
    pub fn new() -> Self {
        let temp = std::env::temp_dir().join("CrossSync_Staging");
        let downloads = dirs_next::download_dir().unwrap_or_else(|| std::env::temp_dir().join("CrossSync_Downloads"));

        Self {
            staging_dir: temp,
            downloads_dir: downloads,
            chunk_size: 65536,
        }
    }

    pub async fn prepare_file_meta(&self, file_path: &str) -> Result<(FileMetaInfo, Vec<u8>), String> {
        let path = Path::new(file_path);
        let mut file = File::open(path).await.map_err(|e| format!("Failed to open file: {}", e))?;
        
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).await.map_err(|e| format!("Failed to read file: {}", e))?;

        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown_file")
            .to_string();

        let mut hasher = Sha256::new();
        hasher.update(&buffer);
        let file_hash_sha256 = format!("{:x}", hasher.finalize());

        let file_size = buffer.len() as u64;
        let total_chunks = ((file_size as f64) / (self.chunk_size as f64)).ceil() as u32;

        let meta = FileMetaInfo {
            transfer_id: Uuid::new_v4().to_string(),
            file_name,
            file_size,
            total_chunks,
            chunk_size: self.chunk_size as u32,
            file_hash_sha256,
            mime_type: "application/octet-stream".to_string(),
        };

        Ok((meta, buffer))
    }

    pub fn generate_chunks(&self, transfer_id: &str, raw_data: &[u8]) -> Vec<FileChunkInfo> {
        let mut chunks = Vec::new();
        let total_chunks = ((raw_data.len() as f64) / (self.chunk_size as f64)).ceil() as usize;

        for (i, slice) in raw_data.chunks(self.chunk_size).enumerate() {
            let mut crc_hasher = Crc32Hasher::new();
            crc_hasher.update(slice);
            let crc32 = crc_hasher.finalize();

            chunks.push(FileChunkInfo {
                transfer_id: transfer_id.to_string(),
                chunk_index: i as u32,
                data: slice.to_vec(),
                crc32,
                is_last: i == total_chunks - 1,
            });
        }

        chunks
    }

    pub async fn write_chunk(&self, chunk: &FileChunkInfo) -> Result<bool, String> {
        let mut crc_hasher = Crc32Hasher::new();
        crc_hasher.update(&chunk.data);
        let computed_crc = crc_hasher.finalize();

        if computed_crc != chunk.crc32 {
            return Err(format!("CRC32 mismatch on chunk {}", chunk.chunk_index));
        }

        fs::create_dir_all(&self.staging_dir)
            .await
            .map_err(|e| e.to_string())?;

        let staging_file_path = self.staging_dir.join(format!("{}.part", chunk.transfer_id));
        let mut file = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&staging_file_path)
            .await
            .map_err(|e| e.to_string())?;

        file.write_all(&chunk.data).await.map_err(|e| e.to_string())?;
        Ok(chunk.is_last)
    }

    pub async fn finalize_transfer(
        &self,
        transfer_id: &str,
        file_name: &str,
        expected_hash: &str,
    ) -> Result<String, String> {
        let staging_file_path = self.staging_dir.join(format!("{}.part", transfer_id));
        
        let mut file = File::open(&staging_file_path)
            .await
            .map_err(|e| format!("Staging file not found: {}", e))?;

        let mut data = Vec::new();
        file.read_to_end(&mut data).await.map_err(|e| e.to_string())?;

        let mut hasher = Sha256::new();
        hasher.update(&data);
        let computed_hash = format!("{:x}", hasher.finalize());

        if computed_hash != expected_hash {
            return Err("SHA-256 hash verification failed".to_string());
        }

        fs::create_dir_all(&self.downloads_dir)
            .await
            .map_err(|e| e.to_string())?;

        let destination = self.downloads_dir.join(file_name);
        fs::rename(&staging_file_path, &destination)
            .await
            .map_err(|e| format!("Failed to move file to downloads: {}", e))?;

        Ok(destination.to_string_lossy().to_string())
    }
}

mod dirs_next {
    use std::path::PathBuf;
    pub fn download_dir() -> Option<PathBuf> {
        std::env::var_os("USERPROFILE")
            .map(PathBuf::from)
            .map(|p| p.join("Downloads"))
    }
}
