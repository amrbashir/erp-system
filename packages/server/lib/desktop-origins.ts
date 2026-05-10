// Tauri webview origins. Dev :1522; prod tauri://localhost (mac/Linux) or http://tauri.localhost (Win/Android). Shared by trustedOrigins + CORS.
export const DESKTOP_TRUSTED_ORIGINS = new Set([
	"http://localhost:1522",
	"http://tauri.localhost",
	"tauri://localhost",
]);
