import { isDesktop } from "./activation";
import { SIDECAR_URL } from "./sidecar";

const TOKEN_KEY = "bearer_token";

export function getStoredToken(): string | null {
	if (typeof localStorage === "undefined") return null;
	return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
	if (typeof localStorage === "undefined") return;
	localStorage.removeItem(TOKEN_KEY);
}

/**
 * Unified fetch helper:
 *  - web: same-origin, cookies travel automatically
 *  - desktop: prepends sidecar URL, attaches Authorization: Bearer
 *
 * Org scope rides in the URL path (`/orgs/{orgSlug}/…`), so no header is
 * needed for it.
 */
export async function apiFetch(path: string, init?: RequestInit) {
	// Headers ctor handles all HeadersInit shapes (Headers/Record/[string,string][])
	// without unsafe casts. Caller's headers win; we only fill in defaults.
	const headers = new Headers(init?.headers);
	if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

	if (isDesktop()) {
		const token = getStoredToken();
		if (token && !headers.has("Authorization")) {
			headers.set("Authorization", `Bearer ${token}`);
		}
		return fetch(`${SIDECAR_URL}${path}`, { ...init, headers });
	}
	return fetch(path, { ...init, headers });
}
