use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub db_path: String,
}

fn config_path(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("failed to resolve app data dir")
        .join("config.json")
}

pub fn default_db_path(app: &tauri::AppHandle) -> String {
    app.path()
        .app_data_dir()
        .expect("failed to resolve app data dir")
        .join("pgdata")
        .to_str()
        .unwrap()
        .to_string()
}

pub fn read_config(app: &tauri::AppHandle) -> AppConfig {
    let path = config_path(app);
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or(AppConfig {
            db_path: default_db_path(app),
        })
    } else {
        AppConfig {
            db_path: default_db_path(app),
        }
    }
}

pub fn write_config(app: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = config_path(app);
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

    // Write a temp file to verify writability
    let test_file = p.join(".erp-write-test");
    fs::write(&test_file, "test").map_err(|e| format!("directory not writable: {e}"))?;
    let _ = fs::remove_file(&test_file);

    Ok(())
}

#[tauri::command]
pub fn get_config(app: tauri::AppHandle) -> AppConfig {
    read_config(&app)
}

#[tauri::command]
pub fn get_default_db_path(app: tauri::AppHandle) -> String {
    default_db_path(&app)
}

#[tauri::command]
pub fn update_db_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    validate_db_path(&path)?;
    let mut config = read_config(&app);
    config.db_path = path;
    write_config(&app, &config)
}

#[tauri::command]
pub async fn pick_db_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let default = default_db_path(&app);
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

/// Move DB data from current path to a new path, update config.
/// Caller must stop/restart the sidecar around this call.
#[tauri::command]
pub fn migrate_db_path(app: tauri::AppHandle, new_path: String) -> Result<(), String> {
    let config = read_config(&app);
    let old_path = PathBuf::from(&config.db_path);
    let new_path_buf = PathBuf::from(&new_path);

    if old_path == new_path_buf {
        return Ok(());
    }

    validate_db_path(&new_path)?;

    // Copy contents from old to new
    if old_path.exists() {
        copy_dir_recursive(&old_path, &new_path_buf)
            .map_err(|e| format!("failed to copy data: {e}"))?;
    }

    // Update config
    let mut config = config;
    config.db_path = new_path;
    write_config(&app, &config)
}

fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn config_roundtrip_serde() {
        let config = AppConfig {
            db_path: "/some/path/pgdata".to_string(),
        };
        let json = serde_json::to_string(&config).unwrap();
        let parsed: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config, parsed);
    }

    #[test]
    fn config_camel_case_keys() {
        let config = AppConfig {
            db_path: "/test".to_string(),
        };
        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("dbPath"));
        assert!(!json.contains("db_path"));
    }

    #[test]
    fn config_deserialize_from_json() {
        let json = r#"{"dbPath":"/custom/dir"}"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.db_path, "/custom/dir");
    }

    #[test]
    fn config_deserialize_bad_json_fails() {
        let result: Result<AppConfig, _> = serde_json::from_str("not json");
        assert!(result.is_err());
    }

    #[test]
    fn validate_db_path_creates_dir() {
        let dir = std::env::temp_dir().join("erp-test-validate-db");
        let _ = fs::remove_dir_all(&dir);
        let result = validate_db_path(dir.to_str().unwrap());
        assert!(result.is_ok());
        assert!(dir.exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn validate_db_path_checks_writability() {
        let dir = std::env::temp_dir().join("erp-test-writable");
        let result = validate_db_path(dir.to_str().unwrap());
        assert!(result.is_ok());
        // .erp-write-test should be cleaned up
        assert!(!dir.join(".erp-write-test").exists());
        let _ = fs::remove_dir_all(&dir);
    }
}
