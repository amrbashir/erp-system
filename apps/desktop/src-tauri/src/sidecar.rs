use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::{process::CommandChild, ShellExt};

use crate::config;

const SIDECAR_PORT: &str = "11435";

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

pub fn start(app: &tauri::AppHandle) {
    let mut cfg = config::read_config(app);

    if let Err(e) = config::validate_db_path(&cfg.db_path) {
        eprintln!("[sidecar] db path inaccessible: {e}, falling back to default");
        cfg.db_path = config::default_db_path(app);
        config::validate_db_path(&cfg.db_path).expect("default pgdata dir inaccessible");
        let _ = config::write_config(app, &cfg);
    }

    let sidecar = app
        .shell()
        .sidecar("erp-sidecar")
        .expect("failed to create sidecar command")
        .env("NITRO_PGDATA_DIR", &cfg.db_path)
        .env("PORT", SIDECAR_PORT);

    let (mut rx, child) = sidecar.spawn().expect("failed to spawn sidecar");

    app.state::<SidecarManager>()
        .child
        .lock()
        .unwrap()
        .replace(child);

    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let text = String::from_utf8_lossy(&line);
                    eprintln!("[sidecar stdout] {text}");
                }
                CommandEvent::Stderr(line) => {
                    let text = String::from_utf8_lossy(&line);
                    eprintln!("[sidecar stderr] {text}");
                }
                CommandEvent::Terminated(payload) => {
                    // If stop() already took the child, don't restart
                    let should_restart = handle
                        .state::<SidecarManager>()
                        .child
                        .lock()
                        .unwrap()
                        .is_some();
                    if should_restart {
                        eprintln!(
                            "[sidecar] crashed code={:?} signal={:?}, restarting...",
                            payload.code, payload.signal
                        );
                        start(&handle);
                    } else {
                        eprintln!("[sidecar] stopped intentionally");
                    }
                    break;
                }
                _ => {}
            }
        }
    });
}

pub fn stop(app: &tauri::AppHandle) {
    if let Some(child) = app
        .state::<SidecarManager>()
        .child
        .lock()
        .unwrap()
        .take()
    {
        let _ = child.kill();
    }
}
