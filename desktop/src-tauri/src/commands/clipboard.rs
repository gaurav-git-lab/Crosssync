use crate::db::ClipboardRecord;
use crate::AppState;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn send_clipboard_event(
    content: String,
    state: State<'_, Arc<AppState>>,
) -> Result<String, String> {
    if content.trim().is_empty() {
        return Err("Cannot sync empty clipboard payload".to_string());
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    let hash = crate::clipboard::ClipboardListener::compute_hash(&content);

    let record = ClipboardRecord {
        id: Uuid::new_v4().to_string(),
        content: content.clone(),
        source_device_id: "windows-pc".to_string(),
        source_platform: "windows".to_string(),
        timestamp: now,
        hash: hash.clone(),
    };

    let _ = state.db.insert_clipboard(&record);

    Ok(format!("Synced successfully at {}", now))
}

#[tauri::command]
pub async fn set_system_clipboard(
    content: String,
    state: State<'_, Arc<AppState>>,
) -> Result<bool, String> {
    state.clipboard_listener.set_clipboard(&content).await?;
    Ok(true)
}

#[tauri::command]
pub async fn get_clipboard_history(
    limit: Option<usize>,
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<ClipboardRecord>, String> {
    state.db.get_recent_clipboard(limit.unwrap_or(50))
}
