// Tauri webview origins that talk to the sidecar across origins. Dev runs on
// :1522; prod uses tauri://localhost (macOS/Linux) or http://tauri.localhost
// (Windows/Android). Shared by better-auth's trustedOrigins and the CORS
// middleware so the two stay in sync.
export const DESKTOP_TRUSTED_ORIGINS = new Set([
	"http://localhost:1522",
	"http://tauri.localhost",
	"tauri://localhost",
]);
