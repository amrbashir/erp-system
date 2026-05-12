export const IS_DESKTOP = import.meta.env.DEPLOY_TARGET === "desktop";

/** Port is set by Rust host (`src-tauri/src/sidecar.rs`) - keep in sync. */
export const SIDECAR_URL = "http://localhost:11435";
