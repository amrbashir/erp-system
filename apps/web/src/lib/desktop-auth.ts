import { apiFetch, storeToken } from "./api-fetch";
import { ApiError } from "./errors";
import { client } from "./orpc";

/**
 * Desktop-only first-run setup: creates the initial owner + org atomically.
 * Web signup uses better-auth's signUp.email instead.
 */
export async function desktopSetup(input: {
	orgName: string;
	email: string;
	password: string;
	name: string;
}): Promise<{
	token: string;
	user: { id: string; name: string; email: string };
	org: { id: string; name: string; slug: string };
}> {
	const data = await client.setup.run(input).catch((e: Error) => e);
	if (data instanceof Error) throw new ApiError({ message: data.message });
	if (data.token) storeToken(data.token);
	return data as {
		token: string;
		user: { id: string; name: string; email: string };
		org: { id: string; name: string; slug: string };
	};
}

/** Lightweight probe: does any user exist? Used by the desktop bootstrap. */
export async function getSetupComplete(): Promise<{ setupComplete: boolean }> {
	const data = await client.setup.isComplete().catch((e: Error) => e);
	if (data instanceof Error) throw new ApiError({ message: data.message });
	return data;
}

/**
 * Poll /api/health until the sidecar reports ok (or timeout). Tauri spawns the
 * sidecar in setup(), but the webview loads in parallel — without this,
 * early calls race the port binding + PGlite init + migrations and surface
 * confusing connection errors.
 */
export async function waitForSidecar(opts?: {
	timeoutMs?: number;
	intervalMs?: number;
}): Promise<boolean> {
	const timeoutMs = opts?.timeoutMs ?? 30_000;
	const intervalMs = opts?.intervalMs ?? 250;
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const res = await apiFetch("/api/health").catch(() => null);
		if (res?.ok) {
			const body = await res.json().catch(() => null);
			if (body?.db === "ok") return true;
		}
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return false;
}
