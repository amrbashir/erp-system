// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod hardware_id;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![hardware_id::get_hardware_id])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
