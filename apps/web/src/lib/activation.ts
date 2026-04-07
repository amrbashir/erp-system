import { verifyTokenOffline as verifyToken } from "./activation-verify";

const ACTIVATION_PUBLIC_KEY = import.meta.env.VITE_ACTIVATION_PUBLIC_KEY as string | undefined;
const ACTIVATION_API_URL = import.meta.env.VITE_ACTIVATION_API_URL as string | undefined;

export function isDesktop(): boolean {
	return import.meta.env.VITE_PLATFORM === "desktop";
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
	const { invoke } = await import("@tauri-apps/api/core");
	return invoke<T>(cmd, args);
}

export async function getHardwareId(): Promise<string> {
	return tauriInvoke<string>("get_hardware_id");
}

export async function readCachedToken(): Promise<string | null> {
	return tauriInvoke<string | null>("read_activation_token");
}

export async function writeCachedToken(token: string): Promise<void> {
	return tauriInvoke<void>("write_activation_token", { token });
}

export async function verifyTokenOffline(
	token: string,
): Promise<{ hardwareId: string; activated: boolean } | null> {
	if (!ACTIVATION_PUBLIC_KEY) return null;
	return verifyToken(token, ACTIVATION_PUBLIC_KEY);
}

export async function checkActivationApi(
	hardwareId: string,
): Promise<{ token: string } | { error: string; status?: string }> {
	if (!ACTIVATION_API_URL) {
		return { error: "Activation API URL not configured" };
	}
	const res = await fetch(`${ACTIVATION_API_URL}/api/activations/check`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ hardwareId }),
	});
	return res.json();
}

export type ActivationState =
	| { status: "activated"; hardwareId: string }
	| { status: "not_activated"; hardwareId: string }
	| { status: "loading" }
	| { status: "not_desktop" };

export async function checkActivationState(): Promise<ActivationState> {
	if (!isDesktop()) return { status: "not_desktop" };

	const hardwareId = await getHardwareId();

	const cached = await readCachedToken();
	if (cached) {
		const result = await verifyTokenOffline(cached);
		if (result) return { status: "activated", hardwareId };
	}

	return { status: "not_activated", hardwareId };
}
