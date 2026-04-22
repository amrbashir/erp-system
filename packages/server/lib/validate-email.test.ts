import { describe, it, expect } from "vitest";

import { isValidEmail } from "./validate-email.js";

describe("isValidEmail", () => {
	it("accepts valid email", () => {
		expect(isValidEmail("user@example.com")).toBe(true);
	});

	it("accepts email with subdomain", () => {
		expect(isValidEmail("user@sub.example.com")).toBe(true);
	});

	it("rejects missing @", () => {
		expect(isValidEmail("userexample.com")).toBe(false);
	});

	it("rejects missing domain", () => {
		expect(isValidEmail("user@")).toBe(false);
	});

	it("rejects missing TLD", () => {
		expect(isValidEmail("user@example")).toBe(false);
	});

	it("rejects empty string", () => {
		expect(isValidEmail("")).toBe(false);
	});

	it("rejects whitespace in email", () => {
		expect(isValidEmail("user @example.com")).toBe(false);
	});
});
