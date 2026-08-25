use arboard::Clipboard;
use sha2::{Digest, Sha256};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time::sleep;

pub struct ClipboardListener {
    last_hash: Arc<Mutex<String>>,
    history_hashes: Arc<Mutex<Vec<String>>>,
    is_running: Arc<Mutex<bool>>,
}

impl ClipboardListener {
    pub fn new() -> Self {
        Self {
            last_hash: Arc::new(Mutex::new(String::new())),
            history_hashes: Arc::new(Mutex::new(Vec::with_capacity(50))),
            is_running: Arc::new(Mutex::new(false)),
        }
    }

    pub fn compute_hash(content: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub async fn set_clipboard(&self, content: &str) -> Result<(), String> {
        let hash = Self::compute_hash(content);
        
        {
            let mut last = self.last_hash.lock().await;
            *last = hash.clone();

            let mut history = self.history_hashes.lock().await;
            if history.len() >= 50 {
                history.remove(0);
            }
            history.push(hash);
        }

        let mut clipboard = Clipboard::new().map_err(|e| format!("Clipboard error: {:?}", e))?;
        clipboard
            .set_text(content)
            .map_err(|e| format!("Failed to write clipboard: {:?}", e))?;

        Ok(())
    }

    pub async fn is_duplicate(&self, hash: &str) -> bool {
        let history = self.history_hashes.lock().await;
        history.contains(&hash.to_string())
    }

    pub async fn start_listening<F>(&self, mut on_change: F)
    where
        F: FnMut(String, String) + Send + 'static,
    {
        {
            let mut running = self.is_running.lock().await;
            if *running {
                return;
            }
            *running = true;
        }

        let last_hash_clone = self.last_hash.clone();
        let history_clone = self.history_hashes.clone();
        let running_clone = self.is_running.clone();

        tokio::spawn(async move {
            loop {
                {
                    let is_active = *running_clone.lock().await;
                    if !is_active {
                        break;
                    }
                }

                if let Ok(mut clipboard) = Clipboard::new() {
                    if let Ok(text) = clipboard.get_text() {
                        if !text.is_empty() {
                            let hash = Self::compute_hash(&text);
                            let mut last = last_hash_clone.lock().await;

                            if *last != hash {
                                *last = hash.clone();
                                let mut history = history_clone.lock().await;
                                if !history.contains(&hash) {
                                    if history.len() >= 50 {
                                        history.remove(0);
                                    }
                                    history.push(hash.clone());
                                    drop(history);
                                    drop(last);

                                    on_change(text, hash);
                                }
                            }
                        }
                    }
                }

                sleep(Duration::from_millis(150)).await;
            }
        });
    }

    pub async fn stop(&self) {
        let mut running = self.is_running.lock().await;
        *running = false;
    }
}
