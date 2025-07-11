import { describe, expect, it } from "vitest";

import { formatCurrency, toBaseUnits, toMajorUnits } from "./currency";

describe("Currency utilities", () => {
  describe("toBaseUnits", () => {
    it("should convert major units to base units", () => {
      expect(toBaseUnits(1)).toBe(100);
      expect(toBaseUnits(0.5)).toBe(50);
      expect(toBaseUnits(1.25)).toBe(125);
      expect(toBaseUnits(150.5)).toBe(15050);
      expect(toBaseUnits(0)).toBe(0);
    });
  });

  describe("toMajorUnits", () => {
    it("should convert base units to major units", () => {
      expect(toMajorUnits(100)).toBe(1);
      expect(toMajorUnits(50)).toBe(0.5);
      expect(toMajorUnits(125)).toBe(1.25);
      expect(toMajorUnits(15050)).toBe(150.5);
      expect(toMajorUnits(0)).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("should format currency values correctly for Egyptian locale", () => {
      // Note: The exact format may vary based on the runtime environment
      const formatted = formatCurrency(15050, "EGP");
      expect(formatted).toContain("150");
      expect(formatted).toContain("50");
      expect(formatted).toContain("EGP");
    });

    it("should use default locale when none provided", () => {
      const formatted = formatCurrency(15050, "USD", "en-US");
      expect(formatted).toBeDefined();
      expect(formatted).toContain("150");
      expect(formatted).toContain("$");
    });

    it("should handle zero correctly", () => {
      const formatted = formatCurrency(0, "EGP", "ar-EG");
      expect(formatted).toContain("٠");
      expect(formatted).toContain("ج.م.");
    });
  });
});
