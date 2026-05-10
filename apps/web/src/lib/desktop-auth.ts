import { ApiError } from "./errors";
import { client } from "./orpc";

/** First-run setup: creates owner + org atomically. Doesn't sign in - `_authed` guard redirects to `/login`. */
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

export async function getSetupComplete(): Promise<{ setupComplete: boolean }> {
	const data = await client.setup.isComplete().catch((e: Error) => e);
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
		const ok = await client.setup
			.isComplete()
			.then(() => true)
			.catch(() => false);
		if (ok) return true;
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return false;
}
