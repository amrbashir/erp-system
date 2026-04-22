import { describe, it, expect } from "vitest";

import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
	it("returns valid relative paths as-is", () => {
		expect(safeRedirect("/dashboard")).toBe("/dashboard");
		expect(safeRedirect("/users")).toBe("/users");
		expect(safeRedirect("/onboarding")).toBe("/onboarding");
		expect(safeRedirect("/new-org")).toBe("/new-org");
	});

	it("returns fallback for undefined/empty", () => {
		expect(safeRedirect(undefined)).toBe("/");
		expect(safeRedirect("")).toBe("/");
	});

	it("returns fallback for absolute URLs", () => {
		expect(safeRedirect("https://evil.com")).toBe("/");
		expect(safeRedirect("http://evil.com")).toBe("/");
	});

	it("returns fallback for protocol-relative URLs", () => {
		expect(safeRedirect("//evil.com")).toBe("/");
	});

	it("returns fallback for backslash trick", () => {
		expect(safeRedirect("/\\evil.com")).toBe("/");
	});

	it("preserves query strings and hashes in valid paths", () => {
		expect(safeRedirect("/dashboard?tab=overview")).toBe("/dashboard?tab=overview");
		expect(safeRedirect("/users#section")).toBe("/users#section");
	});

	it("uses custom fallback when provided", () => {
		expect(safeRedirect("https://evil.com", "/dashboard")).toBe("/dashboard");
		expect(safeRedirect(undefined, "/dashboard")).toBe("/dashboard");
	});
});
