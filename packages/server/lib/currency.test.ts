import { describe, it, expect } from "vitest";

import { SUPPORTED_CURRENCIES, validateCurrency } from "./currency.js";
import { UnsupportedCurrencyError } from "./errors.js";

describe("SUPPORTED_CURRENCIES", () => {
	it("contains common ISO 4217 codes", () => {
		for (const code of ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "JPY", "CNY"]) {
			expect(SUPPORTED_CURRENCIES.has(code)).toBe(true);
		}
	});
});

describe("validateCurrency", () => {
	it("accepts valid currency", () => {
		expect(validateCurrency("USD")).toBeNull();
		expect(validateCurrency("EUR")).toBeNull();
		expect(validateCurrency("EGP")).toBeNull();
	});

	it("rejects invalid currency", () => {
		expect(validateCurrency("XYZ")).toBeInstanceOf(UnsupportedCurrencyError);
		expect(validateCurrency("")).toBeInstanceOf(UnsupportedCurrencyError);
		expect(validateCurrency("usd")).toBeInstanceOf(UnsupportedCurrencyError);
	});
});
