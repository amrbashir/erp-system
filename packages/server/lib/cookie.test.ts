import { describe, it, expect, afterEach, vi } from "vitest";

import { orgSwitchCookieOptions } from "./cookie.js";

describe("orgSwitchCookieOptions", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("sets secure: true when NODE_ENV is production", () => {
		vi.stubEnv("NODE_ENV", "production");
		const opts = orgSwitchCookieOptions();
		expect(opts.secure).toBe(true);
	});

	it("sets secure: false when NODE_ENV is development", () => {
		vi.stubEnv("NODE_ENV", "development");
		const opts = orgSwitchCookieOptions();
		expect(opts.secure).toBe(false);
	});

	it("sets secure: true when NODE_ENV is undefined", () => {
		vi.stubEnv("NODE_ENV", "");
		const opts = orgSwitchCookieOptions();
		expect(opts.secure).toBe(true);
	});

	it("always sets httpOnly, sameSite, path, and maxAge", () => {
		const opts = orgSwitchCookieOptions();
		expect(opts.httpOnly).toBe(true);
		expect(opts.sameSite).toBe("lax");
		expect(opts.path).toBe("/");
		expect(opts.maxAge).toBe(60 * 60 * 24 * 365);
	});
});
