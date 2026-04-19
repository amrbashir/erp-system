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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compute_hardware_id_deterministic() {
        let id1 = compute_hardware_id("CPU123", "MB456");
        let id2 = compute_hardware_id("CPU123", "MB456");
        assert_eq!(id1, id2);
    }

    #[test]
    fn compute_hardware_id_is_sha256_hex() {
        let id = compute_hardware_id("CPU123", "MB456");
        // SHA256 hex = 64 chars
        assert_eq!(id.len(), 64);
        assert!(id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn compute_hardware_id_different_inputs_differ() {
        let id1 = compute_hardware_id("CPU123", "MB456");
        let id2 = compute_hardware_id("CPU999", "MB456");
        assert_ne!(id1, id2);
    }

    #[test]
    fn compute_hardware_id_matches_expected_sha256() {
        // SHA256("CPU123MB456") precomputed
        let expected = sha2::Sha256::digest(b"CPU123MB456");
        let expected_hex = format!("{:x}", expected);
        let id = compute_hardware_id("CPU123", "MB456");
        assert_eq!(id, expected_hex);
    }

    #[test]
    fn get_hardware_id_inner_returns_ok() {
        // Integration test: actually queries WMI on current machine
        let result = get_hardware_id_inner();
        assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
        let id = result.unwrap();
        assert_eq!(id.len(), 64);
        assert!(id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn get_hardware_id_inner_is_deterministic() {
        let id1 = get_hardware_id_inner().unwrap();
        let id2 = get_hardware_id_inner().unwrap();
        assert_eq!(id1, id2);
    }
}
