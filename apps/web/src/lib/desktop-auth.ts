import { ApiError } from "./errors";
import { client } from "./orpc";

/**
 * Desktop-only first-run setup: atomically creates the initial owner + org.
 * Does NOT sign in — the next bootstrap pass sees `setupComplete: true` and
 * the `_authed` guard then routes to `/login`, where the user authenticates
 * normally with the credentials they just set.
 */
export async function desktopSetup(input: {
	orgName: string;
	slug?: string;
	email: string;
	password: string;
	name: string;
}): Promise<void> {
	const data = await client.setup.run(input).catch((e: Error) => e);
	if (data instanceof Error) throw new ApiError({ message: data.message });
}

/** Lightweight probe: does any user exist? Used by the desktop bootstrap. */
export async function getSetupComplete(): Promise<{ setupComplete: boolean }> {
	const data = await client.setup.isComplete().catch((e: Error) => e);
	if (data instanceof Error) throw new ApiError({ message: data.message });
	return data;
}

/**
 * Poll the sidecar until it responds (or timeout). Tauri spawns the sidecar
 * in setup(), but the webview loads in parallel — without this, early calls
 * race the port binding + PGlite init + migrations and surface confusing
 * connection errors. Uses `setup.isComplete` because it's public and
 * exercises the DB, so a successful call means both the API and DB are up.
 */
export async function waitForSidecar(opts?: {
	timeoutMs?: number;
	intervalMs?: number;
}): Promise<boolean> {
	const timeoutMs = opts?.timeoutMs ?? 30_000;
	const intervalMs = opts?.intervalMs ?? 250;
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const ok = await client.setup
			.isComplete()
			.then(() => true)
			.catch(() => false);
		if (ok) return true;
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return false;
}
