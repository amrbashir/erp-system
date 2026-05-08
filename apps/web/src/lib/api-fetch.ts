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

type HeaderRecord = Record<string, string>;

/**
 * Unified fetch helper:
 *  - web: same-origin, cookies travel automatically
 *  - desktop: prepends sidecar URL, attaches Authorization: Bearer
 *
 * Org scope rides in the URL path (`/orgs/{orgSlug}/…`), so no header is
 * needed for it.
 */
export async function apiFetch(path: string, init?: RequestInit) {
	const extra = init?.headers as HeaderRecord | undefined;
	if (isDesktop()) {
		const token = getStoredToken();
		return fetch(`${SIDECAR_URL}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...extra,
			},
		});
	}
	return fetch(path, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...extra,
		},
	});
}
