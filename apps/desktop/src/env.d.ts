interface ImportMetaEnv {
	readonly DEPLOY_TARGET: "desktop" | "web" | "admin";
	readonly ACTIVATION_PUBLIC_KEY?: string;
	readonly ACTIVATION_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
