-- CrossSync Unified SQLite Schema
-- Target: Windows (rusqlite) and Android (sqflite)

-- 1. Paired Devices Table
CREATE TABLE IF NOT EXISTS paired_devices (
    id TEXT PRIMARY KEY,
    device_name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK(platform IN ('windows', 'android', 'macos', 'linux', 'ios')),
    device_type TEXT NOT NULL DEFAULT 'laptop',
    public_key TEXT NOT NULL,
    shared_secret_encrypted TEXT,
    paired_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    is_trusted INTEGER NOT NULL DEFAULT 1,
    bluetooth_mac TEXT,
    ip_address TEXT,
    is_online INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Index for quick lookup during incoming connection
CREATE INDEX IF NOT EXISTS idx_paired_devices_mac ON paired_devices(bluetooth_mac);
CREATE INDEX IF NOT EXISTS idx_paired_devices_ip ON paired_devices(ip_address);

-- 2. Clipboard History Table
CREATE TABLE IF NOT EXISTS clipboard_history (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text/plain' CHECK(content_type IN ('text/plain', 'text/html', 'text/uri-list', 'image/png', 'image/jpeg')),
    source_device_id TEXT NOT NULL,
    source_platform TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    content_hash TEXT NOT NULL,
    char_count INTEGER NOT NULL DEFAULT 0,
    thumbnail_data TEXT,
    FOREIGN KEY(source_device_id) REFERENCES paired_devices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clipboard_timestamp ON clipboard_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_clipboard_hash ON clipboard_history(content_hash);
CREATE INDEX IF NOT EXISTS idx_clipboard_pinned ON clipboard_history(is_pinned);

-- 3. File & Image Transfer History Table
CREATE TABLE IF NOT EXISTS transfer_history (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('outgoing', 'incoming')),
    source_device_id TEXT NOT NULL,
    target_device_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    progress_percentage REAL NOT NULL DEFAULT 0.0,
    speed_bytes_per_sec INTEGER NOT NULL DEFAULT 0,
    local_path TEXT,
    thumbnail_base64 TEXT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    error_message TEXT,
    sha256_checksum TEXT,
    FOREIGN KEY(source_device_id) REFERENCES paired_devices(id) ON DELETE SET NULL,
    FOREIGN KEY(target_device_id) REFERENCES paired_devices(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transfer_started ON transfer_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_status ON transfer_history(status);

-- 4. App Settings Key-Value Store
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Default Settings Seed
INSERT OR IGNORE INTO app_settings (key, value) VALUES
    ('clipboard_sync_enabled', 'true'),
    ('auto_bluetooth_enabled', 'true'),
    ('aes_encryption_enabled', 'true'),
    ('retention_days', '30'),
    ('auto_download_files_under_mb', '25'),
    ('bandwidth_throttle_kbps', '0'),
    ('theme_mode', 'dark'),
    ('sound_feedback_enabled', 'true'),
    ('auto_disconnect_inactivity_mins', '60');
