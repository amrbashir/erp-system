import { describe, expect, it } from "vitest";
import { getNextLocale, localeNames } from "./locale-utils";

describe("localeNames", () => {
	it("has entries for en and ar", () => {
		expect(localeNames.en).toBe("English");
		expect(localeNames.ar).toBe("العربية");
	});
});

describe("getNextLocale", () => {
	const available = ["en", "ar"] as const;

	it("returns ar when current is en", () => {
		expect(getNextLocale("en", available)).toBe("ar");
	});

	it("returns en when current is ar", () => {
		expect(getNextLocale("ar", available)).toBe("en");
	});

	it("wraps around to first locale", () => {
		expect(getNextLocale("ar", ["en", "ar"] as const)).toBe("en");
	});
});
