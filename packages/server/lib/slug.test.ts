import { describe, it, expect } from "vitest";

import { toSlug, validateSlug } from "./slug.js";

describe("toSlug", () => {
	it("lowercases and replaces spaces with hyphens", () => {
		expect(toSlug("My Company")).toBe("my-company");
	});

	it("replaces multiple non-alphanumeric chars with a single hyphen", () => {
		expect(toSlug("hello   world!!")).toBe("hello-world");
	});

	it("strips leading and trailing hyphens", () => {
		expect(toSlug("--test--")).toBe("test");
	});

	it("handles mixed case and special characters", () => {
		expect(toSlug("Acme Corp. & Sons!")).toBe("acme-corp-sons");
	});

	it("returns empty string for non-alphanumeric input", () => {
		expect(toSlug("!!!")).toBe("");
	});

	it("handles single word", () => {
		expect(toSlug("Hello")).toBe("hello");
	});

	it("handles already-valid slug", () => {
		expect(toSlug("my-org")).toBe("my-org");
	});
});

describe("validateSlug", () => {
	it("accepts valid slugs", () => {
		expect(validateSlug("ab")).toBeNull();
		expect(validateSlug("my-org")).toBeNull();
		expect(validateSlug("acme-corp-123")).toBeNull();
		expect(validateSlug("a1")).toBeNull();
	});

	it("rejects single-char slug (min 2)", () => {
		expect(validateSlug("a")).toBeTruthy();
	});

	it("rejects slug longer than 48 chars", () => {
		expect(validateSlug("a".repeat(49))).toBeTruthy();
	});

	it("accepts slug of exactly 48 chars", () => {
		expect(validateSlug("a".repeat(48))).toBeNull();
	});

	it("rejects slug starting with hyphen", () => {
		expect(validateSlug("-abc")).toBeTruthy();
	});

	it("rejects slug ending with hyphen", () => {
		expect(validateSlug("abc-")).toBeTruthy();
	});

	it("rejects slug with uppercase", () => {
		expect(validateSlug("Abc")).toBeTruthy();
	});

	it("rejects slug with special characters", () => {
		expect(validateSlug("my_org")).toBeTruthy();
		expect(validateSlug("my org")).toBeTruthy();
		expect(validateSlug("my.org")).toBeTruthy();
	});

	it("rejects empty string", () => {
		expect(validateSlug("")).toBeTruthy();
	});
});
