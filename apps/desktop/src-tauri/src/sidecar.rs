use std::sync::{Mutex, PoisonError};
use std::time::Duration;
use tauri::{Emitter, Manager};
use tauri_plugin_shell::{process::CommandChild, ShellExt};

use crate::config;

const SIDECAR_PORT: &str = "11435";
const MAX_RESTART_ATTEMPTS: u32 = 5;
const INITIAL_BACKOFF_MS: u64 = 1_000;
const MAX_BACKOFF_MS: u64 = 30_000;

pub struct SidecarManager {
    child: Mutex<Option<CommandChild>>,
}

impl SidecarManager {
    pub fn new() -> Self {
        Self {
            child: Mutex::new(None),
        }
    }
}

/// Operate on the child slot under the mutex. Recovers from poisoning —
/// a sidecar-thread panic shouldn't kill the app.
fn with_child<R>(app: &tauri::AppHandle, f: impl FnOnce(&mut Option<CommandChild>) -> R) -> R {
    let state = app.state::<SidecarManager>();
    let mut guard = state.child.lock().unwrap_or_else(PoisonError::into_inner);
    f(&mut guard)
}

/// Start the sidecar. On crash, restarts with exponential backoff up to
/// `MAX_RESTART_ATTEMPTS` total spawns, then emits `sidecar-died`.
pub fn start(app: &tauri::AppHandle) -> Result<(), String> {
    spawn_attempt(app, 0)
}

fn spawn_attempt(app: &tauri::AppHandle, attempt: u32) -> Result<(), String> {
    let mut cfg = config::read_config(app);

    if let Err(e) = config::validate_db_path(&cfg.db_path) {
        eprintln!("[sidecar] db path inaccessible: {e}, falling back to default");
        cfg.db_path = config::default_db_path(app);
        config::validate_db_path(&cfg.db_path)
            .map_err(|e| format!("default pgdata dir inaccessible: {e}"))?;
        let _ = config::write_config(app, &cfg);
    }

    let sidecar = app
        .shell()
        .sidecar("erp-sidecar")
        .map_err(|e| format!("failed to create sidecar command: {e}"))?
        .env("NITRO_PGDATA_DIR", &cfg.db_path)
        .env("PORT", SIDECAR_PORT);

    let (mut rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("failed to spawn sidecar: {e}"))?;

    with_child(app, |slot| {
        slot.replace(child);
    });

    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    eprintln!("[sidecar stdout] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("[sidecar stderr] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Terminated(payload) => {
                    if with_child(&handle, |slot| slot.is_none()) {
                        eprintln!("[sidecar] stopped intentionally");
                        break;
                    }
                    let next = attempt + 1;
                    if next >= MAX_RESTART_ATTEMPTS {
                        eprintln!(
                            "[sidecar] crashed code={:?} signal={:?}, giving up after {next} attempts",
                            payload.code, payload.signal
                        );
                        let _ = handle.emit("sidecar-died", ());
                        break;
                    }
                    let backoff = (INITIAL_BACKOFF_MS << attempt).min(MAX_BACKOFF_MS);
                    eprintln!(
                        "[sidecar] crashed code={:?} signal={:?}, restart {next}/{MAX_RESTART_ATTEMPTS} in {backoff}ms",
                        payload.code, payload.signal
                    );
                    tokio::time::sleep(Duration::from_millis(backoff)).await;
                    if let Err(e) = spawn_attempt(&handle, next) {
                        eprintln!("[sidecar] restart failed: {e}");
                        let _ = handle.emit("sidecar-died", ());
                    }
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

pub fn stop(app: &tauri::AppHandle) {
    if let Some(child) = with_child(app, |slot| slot.take()) {
        let _ = child.kill();
    }
}
