use sha2::{Digest, Sha256};
use serde::Deserialize;
use wmi::{COMLibrary, WMIConnection};

#[derive(Deserialize)]
#[serde(rename = "Win32_Processor")]
#[serde(rename_all = "PascalCase")]
struct Processor {
    processor_id: String,
}

#[derive(Deserialize)]
#[serde(rename = "Win32_BaseBoard")]
#[serde(rename_all = "PascalCase")]
struct BaseBoard {
    serial_number: String,
}

fn query_cpu_id(wmi: &WMIConnection) -> Result<String, String> {
    let results: Vec<Processor> = wmi
        .raw_query("SELECT ProcessorId FROM Win32_Processor")
        .map_err(|e| format!("Failed to query CPU ID: {e}"))?;
    results
        .first()
        .map(|p| p.processor_id.clone())
        .ok_or_else(|| "No processor found".to_string())
}

fn query_motherboard_serial(wmi: &WMIConnection) -> Result<String, String> {
    let results: Vec<BaseBoard> = wmi
        .raw_query("SELECT SerialNumber FROM Win32_BaseBoard")
        .map_err(|e| format!("Failed to query motherboard serial: {e}"))?;
    results
        .first()
        .map(|b| b.serial_number.clone())
        .ok_or_else(|| "No baseboard found".to_string())
}

pub fn compute_hardware_id(cpu_id: &str, motherboard_serial: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("{cpu_id}{motherboard_serial}"));
    format!("{:x}", hasher.finalize())
}

pub fn get_hardware_id_inner() -> Result<String, String> {
    // SAFETY: COM is already initialized by Tauri/WebView2 on the main thread
    let com = unsafe { COMLibrary::assume_initialized() };
    let wmi = WMIConnection::new(com).map_err(|e| format!("Failed to connect WMI: {e}"))?;
    let cpu_id = query_cpu_id(&wmi)?;
    let motherboard_serial = query_motherboard_serial(&wmi)?;
    Ok(compute_hardware_id(&cpu_id, &motherboard_serial))
}

#[tauri::command]
pub fn get_hardware_id() -> Result<String, String> {
    get_hardware_id_inner()
}
