/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_PLATFORM: "desktop" | "web";
	readonly VITE_ACTIVATION_PUBLIC_KEY?: string;
	readonly VITE_ACTIVATION_API_URL?: string;
	readonly VITE_SIDECAR_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
