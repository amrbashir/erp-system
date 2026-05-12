import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { contract } from "@workspace/server/orpc/contract";

import { SIDECAR_URL } from "../index";
import { ApiError } from "./errors";

type AppContract = typeof contract;

// Cross-origin sidecar - cookies need explicit credentials. Server sets SameSite=None+Secure+Partitioned.
const sidecarClient: ContractRouterClient<AppContract> = createORPCClient(
	new OpenAPILink(contract, {
		url: `${SIDECAR_URL}/api`,
		fetch: (request, init) => fetch(request, { ...init, credentials: "include" }),
	}),
);

/** First-run setup: creates owner + org atomically. Doesn't sign in - `_authed` guard redirects to `/login`. */
export async function desktopSetup(input: {
	orgName: string;
	slug?: string;
	email: string;
	password: string;
	name: string;
}): Promise<void> {
	const data = await sidecarClient.setup.run(input).catch((e: Error) => e);
	if (data instanceof Error) throw new ApiError({ message: data.message });
}

export async function getSetupComplete(): Promise<{ setupComplete: boolean }> {
	const data = await sidecarClient.setup.isComplete().catch((e: Error) => e);
	if (data instanceof Error) throw new ApiError({ message: data.message });
	return data;
}

/** Polls until ready - sidecar spawn races webview load. `setup.isComplete` is public and exercises the DB, so success means API + DB are up. */
export async function waitForSidecar(opts?: {
	timeoutMs?: number;
	intervalMs?: number;
}): Promise<boolean> {
	const timeoutMs = opts?.timeoutMs ?? 30_000;
	const intervalMs = opts?.intervalMs ?? 250;
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const ok = await sidecarClient.setup
			.isComplete()
			.then(() => true)
			.catch(() => false);
		if (ok) return true;
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return false;
}
