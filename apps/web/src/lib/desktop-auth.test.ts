import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("SIDECAR_URL configuration", () => {
	const DEFAULT_URL = "http://localhost:11435";

	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ setupComplete: false, loggedIn: false, user: null }),
			}),
		);
		vi.stubGlobal("localStorage", {
			getItem: vi.fn().mockReturnValue(null),
			setItem: vi.fn(),
			removeItem: vi.fn(),
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it("uses default URL when VITE_SIDECAR_URL is not set", async () => {
		delete import.meta.env.VITE_SIDECAR_URL;

		const { getDesktopAuthStatus } = await import("./desktop-auth.js");
		await getDesktopAuthStatus();

		expect(fetch).toHaveBeenCalledWith(
			`${DEFAULT_URL}/api/auth/status`,
			expect.objectContaining({ headers: expect.any(Object) }),
		);
	});

	it("uses VITE_SIDECAR_URL when set", async () => {
		import.meta.env.VITE_SIDECAR_URL = "http://custom:9999";

		const { getDesktopAuthStatus } = await import("./desktop-auth.js");
		await getDesktopAuthStatus();

		expect(fetch).toHaveBeenCalledWith(
			"http://custom:9999/api/auth/status",
			expect.objectContaining({ headers: expect.any(Object) }),
		);
	});

	it("falls back to default when VITE_SIDECAR_URL is empty string", async () => {
		import.meta.env.VITE_SIDECAR_URL = "";

		const { getDesktopAuthStatus } = await import("./desktop-auth.js");
		await getDesktopAuthStatus();

		expect(fetch).toHaveBeenCalledWith(
			`${DEFAULT_URL}/api/auth/status`,
			expect.objectContaining({ headers: expect.any(Object) }),
		);
	});
});
