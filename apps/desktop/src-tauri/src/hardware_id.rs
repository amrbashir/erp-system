use sha2::{Digest, Sha256};

/// Compute hardware ID: SHA256 of cpu_id + board_serial.
pub fn compute_hardware_id(cpu_id: &str, board_serial: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(cpu_id.as_bytes());
    hasher.update(board_serial.as_bytes());
    hex::encode(hasher.finalize())
}

/// Read CPU ProcessorId via PowerShell CIM.
#[cfg(windows)]
fn get_cpu_id() -> Result<String, String> {
    run_powershell("(Get-CimInstance Win32_Processor).ProcessorId")
}

/// Read motherboard serial via PowerShell CIM.
#[cfg(windows)]
fn get_motherboard_serial() -> Result<String, String> {
    run_powershell("(Get-CimInstance Win32_BaseBoard).SerialNumber")
}

#[cfg(windows)]
fn run_powershell(command: &str) -> Result<String, String> {
    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", command])
        .output()
        .map_err(|e| format!("Failed to run powershell: {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "PowerShell failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let value = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if value.is_empty() {
        return Err("Empty value from PowerShell".to_string());
    }

    Ok(value)
}

/// Tauri command: get deterministic hardware ID for this machine.
#[tauri::command]
pub fn get_hardware_id() -> Result<String, String> {
    #[cfg(windows)]
    {
        let cpu_id = get_cpu_id()?;
        let board_serial = get_motherboard_serial()?;
        Ok(compute_hardware_id(&cpu_id, &board_serial))
    }
    #[cfg(not(windows))]
    {
        Err("Hardware ID generation is only supported on Windows".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compute_hardware_id_deterministic() {
        let id1 = compute_hardware_id("CPU123", "BOARD456");
        let id2 = compute_hardware_id("CPU123", "BOARD456");
        assert_eq!(id1, id2);
    }

    #[test]
    fn compute_hardware_id_is_valid_sha256_hex() {
        let id = compute_hardware_id("CPU123", "BOARD456");
        assert_eq!(id.len(), 64); // SHA256 = 32 bytes = 64 hex chars
        assert!(id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn compute_hardware_id_different_inputs_different_outputs() {
        let id1 = compute_hardware_id("CPU123", "BOARD456");
        let id2 = compute_hardware_id("CPU999", "BOARD456");
        assert_ne!(id1, id2);
    }

    #[test]
    fn compute_hardware_id_known_value() {
        // SHA256("CPU123BOARD456") precomputed
        let expected = sha2_hex("CPU123BOARD456");
        let id = compute_hardware_id("CPU123", "BOARD456");
        assert_eq!(id, expected);
    }

    fn sha2_hex(input: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes());
        hex::encode(hasher.finalize())
    }

    #[test]
    #[cfg(windows)]
    fn get_hardware_id_returns_ok() {
        let result = get_hardware_id();
        assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
        let id = result.unwrap();
        assert_eq!(id.len(), 64);
        assert!(id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    #[cfg(windows)]
    fn get_hardware_id_is_deterministic() {
        let id1 = get_hardware_id().unwrap();
        let id2 = get_hardware_id().unwrap();
        assert_eq!(id1, id2);
    }
}
