import { describe, it, expect } from "vitest";

import { toSlug } from "./slug.js";

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
