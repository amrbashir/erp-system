use keyring::{Entry, Error};

const KEYRING_SERVICE: &str = "erp-system";
const KEYRING_USER: &str = "activation_token";

fn entry() -> Result<Entry, String> {
    Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_activation_token() -> Result<Option<String>, String> {
    match entry()?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn write_activation_token(token: String) -> Result<(), String> {
    entry()?.set_password(&token).map_err(|e| e.to_string())
}
