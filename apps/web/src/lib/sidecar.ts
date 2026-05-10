/**
 * Tauri sidecar HTTP base URL. The Rust host (`apps/desktop/src-tauri/src/sidecar.rs`)
 * is the source of truth for the port — keep this fallback in sync if the
 * sidecar `PORT` env var changes there.
 */
export const SIDECAR_URL = "http://localhost:11435";
