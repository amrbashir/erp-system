import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { contract } from "@workspace/server/orpc/contract";

import { verifyTokenOffline as verifyToken } from "./activation-verify";
import { ActivationMisconfiguredError, ApiError, InvalidTokenError } from "./errors";

type AppContract = typeof contract;

const ACTIVATION_PUBLIC_KEY = import.meta.env.ACTIVATION_PUBLIC_KEY;
const ACTIVATION_API_URL = import.meta.env.ACTIVATION_API_URL;

export function isDesktop(): boolean {
	return import.meta.env.DEPLOY_TARGET === "desktop";
}

/** Lazy so unconfigured envs don't crash on import. */
let _activationClient: ContractRouterClient<AppContract> | null | undefined;
function getActivationClient(): ContractRouterClient<AppContract> | null {
	if (_activationClient !== undefined) return _activationClient;
	if (!ACTIVATION_API_URL) return (_activationClient = null);
	const link = new OpenAPILink(contract, { url: `${ACTIVATION_API_URL}/api` });
	return (_activationClient = createORPCClient<ContractRouterClient<AppContract>>(link));
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
	const { invoke } = await import("@tauri-apps/api/core");
	// Tauri rejects with strings - normalize so callers can `instanceof Error`.
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

export async function checkActivationApi(hardwareId: string) {
	const client = getActivationClient();
	if (!client) return new ActivationMisconfiguredError();

	const result = await client.activations.check({ hardwareId }).catch((e: Error) => e);
	if (result instanceof Error) return new ApiError({ message: result.message });
	return result;
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
