mod hardware_id;

#[tauri::command]
fn get_hardware_id() -> Result<String, String> {
    hardware_id::generate_hardware_id()
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_hardware_id])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
