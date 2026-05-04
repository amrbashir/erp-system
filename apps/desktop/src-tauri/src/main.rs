// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod activation;
mod config;
mod hardware_id;
mod sidecar;

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(sidecar::SidecarManager::new())
        .setup(|app| {
            sidecar::start(&app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            hardware_id::get_hardware_id,
            activation::read_activation_token,
            activation::write_activation_token,
            config::get_config,
            config::get_default_db_path,
            config::update_db_path,
            config::pick_db_directory,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            sidecar::stop(app_handle);
        }
    });
}
