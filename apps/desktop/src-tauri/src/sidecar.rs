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
    let cfg = config::read_config(app);
    let pgdata = std::path::PathBuf::from(&cfg.db_path);

    if let Err(e) = config::validate_db_path(&cfg.db_path) {
        eprintln!("[sidecar] db path inaccessible: {e}, falling back to default");
        let default_path = config::default_db_path(app);
        std::fs::create_dir_all(&default_path).expect("failed to create default pgdata dir");
        // Update config to default so it's consistent
        let mut cfg = cfg;
        cfg.db_path = default_path.clone();
        let _ = config::write_config(app, &cfg);
    } else {
        std::fs::create_dir_all(&pgdata).expect("failed to create pgdata dir");
    }

    let cfg = config::read_config(app);

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
