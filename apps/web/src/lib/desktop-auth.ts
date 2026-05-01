import { apiFetch, storeToken } from "./api-fetch";
import { ApiError } from "./errors";
import { readErrorMessage } from "./http";

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
	const res = await apiFetch("/api/auth/setup", {
		method: "POST",
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		throw new ApiError({ message: await readErrorMessage(res, "Setup failed") });
	}
	const data = await res.json();
	if (data.token) storeToken(data.token);
	return data;
}

/** Lightweight probe: does any user exist? Used by the desktop bootstrap. */
export async function getSetupComplete(): Promise<{ setupComplete: boolean }> {
	const res = await apiFetch("/api/auth/setup-complete");
	if (!res.ok) {
		throw new ApiError({ message: await readErrorMessage(res, "Status check failed") });
	}
	return res.json();
}
