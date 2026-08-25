use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardRecord {
    pub id: String,
    pub content: String,
    pub source_device_id: String,
    pub source_platform: String,
    pub timestamp: u64,
    pub hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceRecord {
    pub id: String,
    pub name: String,
    pub platform: String,
    pub bluetooth_address: Option<String>,
    pub ip_address: Option<String>,
    pub is_trusted: bool,
    pub last_synced_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferRecord {
    pub id: String,
    pub file_name: String,
    pub file_size: u64,
    pub sender_device_id: String,
    pub receiver_device_id: String,
    pub status: String,
    pub file_path: Option<String>,
    pub timestamp: u64,
}

pub struct DatabaseManager {
    conn: Arc<Mutex<Connection>>,
}

impl DatabaseManager {
    pub fn new() -> Result<Self, String> {
        let db_path = std::env::temp_dir().join("crosssync.db");
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open SQLite db: {}", e))?;

        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        db.initialize_tables()?;
        Ok(db)
    }

    fn initialize_tables(&self) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS clipboard_history (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                source_device_id TEXT NOT NULL,
                source_platform TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                hash TEXT NOT NULL
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS paired_devices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                platform TEXT NOT NULL,
                bluetooth_address TEXT,
                ip_address TEXT,
                is_trusted INTEGER NOT NULL DEFAULT 1,
                last_synced_at INTEGER NOT NULL
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS file_transfers (
                id TEXT PRIMARY KEY,
                file_name TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                sender_device_id TEXT NOT NULL,
                receiver_device_id TEXT NOT NULL,
                status TEXT NOT NULL,
                file_path TEXT,
                timestamp INTEGER NOT NULL
            );",
            [],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn insert_clipboard(&self, record: &ClipboardRecord) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO clipboard_history (id, content, source_device_id, source_platform, timestamp, hash)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                record.id,
                record.content,
                record.source_device_id,
                record.source_platform,
                record.timestamp,
                record.hash,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_recent_clipboard(&self, limit: usize) -> Result<Vec<ClipboardRecord>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, content, source_device_id, source_platform, timestamp, hash FROM clipboard_history ORDER BY timestamp DESC LIMIT ?1")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![limit as i64], |row| {
                Ok(ClipboardRecord {
                    id: row.get(0)?,
                    content: row.get(1)?,
                    source_device_id: row.get(2)?,
                    source_platform: row.get(3)?,
                    timestamp: row.get(4)?,
                    hash: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for item in rows {
            if let Ok(record) = item {
                list.push(record);
            }
        }
        Ok(list)
    }
}
