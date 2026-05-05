use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub db_path: String,
}

fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {e}"))?
        .join("config.json"))
}

pub fn default_db_path(app: &tauri::AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {e}"))?
        .join("pgdata");
    path.to_str()
        .map(str::to_string)
        .ok_or_else(|| "app data dir contains non-UTF8 characters".to_string())
}

pub fn read_config(app: &tauri::AppHandle) -> Result<AppConfig, String> {
    let path = config_path(app)?;
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        if let Ok(config) = serde_json::from_str(&content) {
            return Ok(config);
        }
    }
    Ok(AppConfig {
        db_path: default_db_path(app)?,
    })
}

pub fn write_config(app: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = config_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("failed to create config dir: {e}"))?;
    }
    let json = serde_json::to_string_pretty(config).map_err(|e| format!("serialize error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("failed to write config: {e}"))?;
    Ok(())
}

/// Validate that a directory path is usable for the DB.
/// Creates the directory if it doesn't exist, then checks writability.
pub fn validate_db_path(path: &str) -> Result<(), String> {
    let p = PathBuf::from(path);
    fs::create_dir_all(&p).map_err(|e| format!("cannot create directory: {e}"))?;

    // Unique probe filename + RAII cleanup. Concurrent callers (and a panic
    // mid-write) can't collide on a fixed path or leave stale junk behind.
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let probe = p.join(format!(".erp-write-test-{}-{nanos}", std::process::id()));

    struct Cleanup(PathBuf);
    impl Drop for Cleanup {
        fn drop(&mut self) {
            let _ = fs::remove_file(&self.0);
        }
    }
    let _guard = Cleanup(probe.clone());

    fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&probe)
        .map_err(|e| format!("directory not writable: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_config(app: tauri::AppHandle) -> Result<AppConfig, String> {
    read_config(&app)
}

#[tauri::command]
pub fn get_default_db_path(app: tauri::AppHandle) -> Result<String, String> {
    default_db_path(&app)
}

/// Persist a new DB path. Takes effect on next app launch — the running
/// sidecar reads `db_path` once at startup. The frontend should warn the
/// user a reboot is required after calling this.
///
/// Data is NOT migrated: the new path is used as-is. If pgdata already
/// exists there it'll be reused; otherwise PGlite initializes a fresh
/// cluster on first start.
#[tauri::command]
pub fn update_db_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    validate_db_path(&path)?;
    let mut config = read_config(&app)?;
    config.db_path = path;
    write_config(&app, &config)
}

#[tauri::command]
pub async fn pick_db_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let default = default_db_path(&app)?;
    let picked = app
        .dialog()
        .file()
        .set_directory(&default)
        .blocking_pick_folder();
    match picked {
        Some(path) => {
            let p = path.to_string();
            validate_db_path(&p)?;
            Ok(Some(p))
        }
        None => Ok(None),
    }
}
