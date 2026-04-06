use sha2::{Digest, Sha256};
use std::process::Command;

/// Compute SHA256 hex digest from CPU ID + motherboard serial.
pub fn compute_hardware_id(cpu_id: &str, motherboard_serial: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("{cpu_id}{motherboard_serial}"));
    hex::encode(hasher.finalize())
}

/// Run a PowerShell command and return trimmed stdout.
fn powershell_query(command: &str) -> Result<String, String> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", command])
        .output()
        .map_err(|e| format!("failed to run powershell: {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "powershell exited with {}: {}",
            output.status,
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if stdout.is_empty() {
        Ok("UNKNOWN".to_string())
    } else {
        Ok(stdout)
    }
}

/// Read CPU processor ID via PowerShell.
fn read_cpu_id() -> Result<String, String> {
    powershell_query("(Get-CimInstance -ClassName Win32_Processor).ProcessorId")
}

/// Read motherboard serial number via PowerShell.
fn read_motherboard_serial() -> Result<String, String> {
    powershell_query("(Get-CimInstance -ClassName Win32_BaseBoard).SerialNumber")
}

/// Generate hardware ID: SHA256(cpu_id + motherboard_serial).
pub fn generate_hardware_id() -> Result<String, String> {
    let cpu_id = read_cpu_id()?;
    let motherboard_serial = read_motherboard_serial()?;
    Ok(compute_hardware_id(&cpu_id, &motherboard_serial))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compute_hardware_id_deterministic() {
        let a = compute_hardware_id("CPU123", "MB456");
        let b = compute_hardware_id("CPU123", "MB456");
        assert_eq!(a, b);
    }

    #[test]
    fn compute_hardware_id_is_sha256_hex() {
        let id = compute_hardware_id("CPU123", "MB456");
        assert_eq!(id.len(), 64);
        assert!(id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn compute_hardware_id_different_inputs_differ() {
        let a = compute_hardware_id("CPU123", "MB456");
        let b = compute_hardware_id("CPU999", "MB456");
        assert_ne!(a, b);
    }

    #[test]
    fn compute_hardware_id_known_value() {
        let expected = {
            let mut h = Sha256::new();
            h.update("CPU123MB456");
            hex::encode(h.finalize())
        };
        assert_eq!(compute_hardware_id("CPU123", "MB456"), expected);
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn generate_hardware_id_returns_deterministic_value() {
        let a = generate_hardware_id().unwrap();
        let b = generate_hardware_id().unwrap();
        assert_eq!(a, b);
        assert_eq!(a.len(), 64);
    }
}
