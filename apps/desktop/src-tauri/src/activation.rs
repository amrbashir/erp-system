use std::fs;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn read_activation_token(app: AppHandle) -> Result<Option<String>, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = data_dir.join("activation.json");
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(Some(content))
}

#[tauri::command]
pub fn write_activation_token(app: AppHandle, token: String) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    let path = data_dir.join("activation.json");
    fs::write(&path, token).map_err(|e| e.to_string())?;
    Ok(())
}
