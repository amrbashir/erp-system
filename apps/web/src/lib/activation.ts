import { verifyTokenOffline as verifyToken } from "./activation-verify";
import { ActivationMisconfiguredError, ApiError, InvalidTokenError } from "./errors";

const ACTIVATION_PUBLIC_KEY = import.meta.env.VITE_ACTIVATION_PUBLIC_KEY as string | undefined;
const ACTIVATION_API_URL = import.meta.env.VITE_ACTIVATION_API_URL as string | undefined;

export function isDesktop(): boolean {
	return import.meta.env.VITE_PLATFORM === "desktop";
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
	const { invoke } = await import("@tauri-apps/api/core");
	// Tauri commands reject with strings (Rust `Err(String)`) — normalize to Error
	// so callers can rely on `instanceof Error` and `.catch((e: Error) => e)`.
	return invoke<T>(cmd, args).catch((e: unknown) => {
		throw e instanceof Error ? e : new Error(typeof e === "string" ? e : JSON.stringify(e));
	});
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
): Promise<InvalidTokenError | { hardwareId: string; activated: boolean }> {
	if (!ACTIVATION_PUBLIC_KEY) {
		return new InvalidTokenError({ reason: "Activation public key not configured" });
	}
	return verifyToken(token, ACTIVATION_PUBLIC_KEY);
}

export type ActivationCheckResult =
	| { token: string }
	| { status: "pending" | "revoked" | "unknown" };

export async function checkActivationApi(
	hardwareId: string,
): Promise<ActivationMisconfiguredError | ApiError | ActivationCheckResult> {
	if (!ACTIVATION_API_URL) {
		return new ActivationMisconfiguredError();
	}
	const res = await fetch(`${ACTIVATION_API_URL}/api/activations/check`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ hardwareId }),
	}).catch((e: Error) => e);
	if (res instanceof Error) return new ApiError({ message: res.message });

	const data = await res.json().catch((e: Error) => e);
	if (data instanceof Error) return new ApiError({ message: "Failed to parse response" });

	if (data && typeof data === "object" && ("token" in data || "status" in data)) {
		return data as ActivationCheckResult;
	}
	return new ApiError({ message: `Unexpected activation response (HTTP ${res.status})` });
}

export type ActivationState =
	| { status: "activated"; hardwareId: string }
	| { status: "not_activated"; hardwareId: string }
	| { status: "loading" }
	| { status: "not_desktop" }
	| { status: "error"; error: Error };

export async function checkActivationState(): Promise<ActivationState> {
	if (!isDesktop()) return { status: "not_desktop" };

	const hardwareId = await getHardwareId().catch((e: Error) => e);
	if (hardwareId instanceof Error) return { status: "error", error: hardwareId };

	const cached = await readCachedToken().catch((e: Error) => e);
	if (cached instanceof Error) return { status: "error", error: cached };
	if (cached) {
		const result = await verifyTokenOffline(cached);
		if (!(result instanceof Error)) return { status: "activated", hardwareId };
	}

	return { status: "not_activated", hardwareId };
}
