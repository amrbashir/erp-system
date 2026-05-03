import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@workspace/server/orpc/router";

import { verifyTokenOffline as verifyToken } from "./activation-verify";
import { ActivationMisconfiguredError, ApiError, InvalidTokenError } from "./errors";

const ACTIVATION_PUBLIC_KEY = import.meta.env.VITE_ACTIVATION_PUBLIC_KEY as string | undefined;
const ACTIVATION_API_URL = import.meta.env.VITE_ACTIVATION_API_URL as string | undefined;

export function isDesktop(): boolean {
	return import.meta.env.VITE_PLATFORM === "desktop";
}

/**
 * Cross-origin oRPC client for the activation server (separate deployment
 * from the sidecar). Built lazily so unconfigured envs don't crash on import.
 */
let _activationClient: RouterClient<AppRouter> | null | undefined;
function getActivationClient(): RouterClient<AppRouter> | null {
	if (_activationClient !== undefined) return _activationClient;
	if (!ACTIVATION_API_URL) return (_activationClient = null);
	const link = new RPCLink({ url: `${ACTIVATION_API_URL}/rpc` });
	return (_activationClient = createORPCClient<RouterClient<AppRouter>>(link));
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
	const client = getActivationClient();
	if (!client) return new ActivationMisconfiguredError();

	const result = await client.activations.check({ hardwareId }).catch((e: Error) => e);
	if (result instanceof Error) return new ApiError({ message: result.message });
	return result as ActivationCheckResult;
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
