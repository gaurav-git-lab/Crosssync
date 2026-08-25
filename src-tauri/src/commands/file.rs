use crate::file::{FileChunkInfo, FileMetaInfo, FileTransferEngine};
use crate::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn prepare_file_transfer(
    file_path: String,
    state: State<'_, Arc<AppState>>,
) -> Result<FileMetaInfo, String> {
    let (meta, _raw_data) = state.file_engine.prepare_file_meta(&file_path).await?;
    Ok(meta)
}

#[tauri::command]
pub async fn receive_file_chunk(
    chunk: FileChunkInfo,
    state: State<'_, Arc<AppState>>,
) -> Result<bool, String> {
    state.file_engine.write_chunk(&chunk).await
}

#[tauri::command]
pub async fn finalize_received_file(
    transfer_id: String,
    file_name: String,
    expected_hash: String,
    state: State<'_, Arc<AppState>>,
) -> Result<String, String> {
    state
        .file_engine
        .finalize_transfer(&transfer_id, &file_name, &expected_hash)
        .await
}
