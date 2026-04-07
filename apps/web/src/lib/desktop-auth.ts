const SIDECAR_URL = "http://localhost:11435";
const TOKEN_KEY = "desktop_session_token";

export function getStoredToken(): string | null {
	return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
	localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
	localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
	const token = getStoredToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

async function sidecarFetch(path: string, init?: RequestInit) {
	return fetch(`${SIDECAR_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...authHeaders(),
			...init?.headers,
		},
	});
}

export type DesktopAuthStatus = {
	setupComplete: boolean;
	loggedIn: boolean;
	user: { id: string; name: string; username: string } | null;
};

export async function getDesktopAuthStatus(): Promise<DesktopAuthStatus> {
	const res = await sidecarFetch("/api/auth/status");
	return res.json();
}

export async function desktopSetup(input: {
	orgName: string;
	username: string;
	password: string;
	name: string;
}): Promise<{
	token: string;
	user: { id: string; name: string; username: string };
	org: { id: string; name: string; slug: string };
}> {
	const res = await sidecarFetch("/api/auth/setup", {
		method: "POST",
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => null);
		throw new Error(data?.message ?? "Setup failed");
	}
	const data = await res.json();
	storeToken(data.token);
	return data;
}

export async function desktopLogin(input: { username: string; password: string }): Promise<{
	token: string;
	user: { id: string; name: string; username: string };
}> {
	const res = await sidecarFetch("/api/auth/login", {
		method: "POST",
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => null);
		throw new Error(data?.message ?? "Login failed");
	}
	const data = await res.json();
	storeToken(data.token);
	return data;
}

export async function desktopLogout(): Promise<void> {
	await sidecarFetch("/api/auth/logout", { method: "POST" });
	clearToken();
}

export type DesktopSession = {
	user: { id: string; name: string; username: string };
	orgs: Array<{
		id: string;
		name: string;
		slug: string;
		defaultCurrency: string;
		role: string;
	}>;
};

export async function getDesktopSession(): Promise<DesktopSession | null> {
	const token = getStoredToken();
	if (!token) return null;

	const res = await sidecarFetch("/api/auth/session");
	if (!res.ok) {
		clearToken();
		return null;
	}
	return res.json();
}

export async function getDesktopMembers(orgId: string) {
	const res = await sidecarFetch(`/api/orgs/members?orgId=${orgId}`);
	if (!res.ok) throw new Error("Failed to fetch members");
	return res.json();
}

export async function addDesktopMember(
	orgId: string,
	input: { username: string; password: string; name: string; role: string },
) {
	const res = await sidecarFetch(`/api/orgs/members?orgId=${orgId}`, {
		method: "POST",
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => null);
		throw new Error(data?.message ?? "Failed to add user");
	}
	return res.json();
}

export async function updateDesktopMemberRole(orgId: string, memberId: string, role: string) {
	const res = await sidecarFetch(`/api/orgs/members/${memberId}?orgId=${orgId}`, {
		method: "PATCH",
		body: JSON.stringify({ role }),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => null);
		throw new Error(data?.message ?? "Failed to update role");
	}
	return res.json();
}

export async function removeDesktopMember(orgId: string, memberId: string) {
	const res = await sidecarFetch(`/api/orgs/members/${memberId}?orgId=${orgId}`, {
		method: "DELETE",
	});
	if (!res.ok) {
		const data = await res.json().catch(() => null);
		throw new Error(data?.message ?? "Failed to remove user");
	}
	return res.json();
}
