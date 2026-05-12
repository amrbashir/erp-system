import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { activationTokenPayload } from "@workspace/server/activations/activations.token";
import { contract } from "@workspace/server/orpc/contract";
import { jwtVerify, importSPKI } from "jose";
import type * as z from "zod";

import { IS_DESKTOP } from "../index";
import { ActivationMisconfiguredError, ApiError, InvalidTokenError } from "./errors";

type AppContract = typeof contract;

const ACTIVATION_PUBLIC_KEY = import.meta.env.ACTIVATION_PUBLIC_KEY;
const ACTIVATION_API_URL = import.meta.env.ACTIVATION_API_URL;

const activationClient: ContractRouterClient<AppContract> | null = ACTIVATION_API_URL
	? createORPCClient<ContractRouterClient<AppContract>>(
			new OpenAPILink(contract, { url: `${ACTIVATION_API_URL}/api` }),
		)
	: null;

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
): Promise<InvalidTokenError | z.infer<typeof activationTokenPayload>> {
	if (!ACTIVATION_PUBLIC_KEY) {
		return new InvalidTokenError({ reason: "Activation public key not configured" });
	}
	const key = await importSPKI(ACTIVATION_PUBLIC_KEY, "ES256").catch((e: Error) => e);
	if (key instanceof Error) {
		return new InvalidTokenError({ reason: key.message, cause: key });
	}
	const verified = await jwtVerify(token, key).catch((e: Error) => e);
	if (verified instanceof Error) {
		return new InvalidTokenError({ reason: verified.message, cause: verified });
	}
	const parsed = activationTokenPayload.safeParse(verified.payload);
	if (!parsed.success) {
		return new InvalidTokenError({ reason: "Malformed token payload" });
	}
	if (!parsed.data.activated) {
		return new InvalidTokenError({ reason: "Token not activated" });
	}
	return parsed.data;
}

export async function checkActivationApi(hardwareId: string) {
	if (!activationClient) return new ActivationMisconfiguredError();

	const result = await activationClient.activations.check({ hardwareId }).catch((e: Error) => e);
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
	if (!IS_DESKTOP) return { status: "not_desktop" };

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
