// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod activation;
mod config;
mod hardware_id;
mod sidecar;

fn install_shutdown_hooks(app: tauri::AppHandle) {
    // Kill sidecar on panic before unwinding. Primary defence on Unix; on Windows the Job Object backs it up.
    let panic_app = app.clone();
    let prev = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        sidecar::stop(&panic_app);
        prev(info);
    }));

    // SIGINT/SIGTERM/SIGHUP/Ctrl+C -> graceful exit so RunEvent::Exit fires.
    let _ = ctrlc::set_handler(move || app.exit(0));
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(sidecar::SidecarManager::new())
        .setup(|app| {
            sidecar::start(&app.handle())?;
            install_shutdown_hooks(app.handle().clone());
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
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                sidecar::stop(app_handle);
            }
        });
}
