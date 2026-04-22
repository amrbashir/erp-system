import { describe, it, expect } from "vitest";

import { validatePassword } from "./validate-password.js";

describe("validatePassword", () => {
	it("rejects passwords shorter than 6 characters", () => {
		const result = validatePassword("Ab1cd");
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.message).toMatch(/at least 6/i);
	});

	it("rejects passwords missing uppercase letter", () => {
		const result = validatePassword("abcdef1");
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.message).toMatch(/uppercase/i);
	});

	it("rejects passwords missing lowercase letter", () => {
		const result = validatePassword("ABCDEF1");
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.message).toMatch(/lowercase/i);
	});

	it("rejects passwords missing digit", () => {
		const result = validatePassword("Abcdefg");
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.message).toMatch(/digit/i);
	});

	it("accepts valid password with all requirements", () => {
		const result = validatePassword("Abcdef1");
		expect(result.valid).toBe(true);
	});

	it("accepts password at exactly 6 characters", () => {
		const result = validatePassword("Abcde1");
		expect(result.valid).toBe(true);
	});
});
