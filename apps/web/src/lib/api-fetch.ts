import { isDesktop } from "./activation";

const SIDECAR_URL = import.meta.env.VITE_SIDECAR_URL || "http://localhost:11435";
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

function getCurrentOrgId(): string | null {
	if (typeof localStorage === "undefined") return null;
	return localStorage.getItem("current_org_id");
}

type HeaderRecord = Record<string, string>;

/**
 * Unified fetch helper:
 *  - web: same-origin, cookies travel automatically (incl. current_org_id)
 *  - desktop: prepends sidecar URL, attaches Authorization: Bearer + X-Org-Id headers
 */
export async function apiFetch(path: string, init?: RequestInit) {
	const extra = init?.headers as HeaderRecord | undefined;
	if (isDesktop()) {
		const token = getStoredToken();
		const orgId = getCurrentOrgId();
		return fetch(`${SIDECAR_URL}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...(orgId ? { "X-Org-Id": orgId } : {}),
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
