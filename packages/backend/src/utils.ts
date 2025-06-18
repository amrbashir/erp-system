export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  describe("slugify", () => {
    it("converts string to lowercase", () => {
      expect(slugify("Hello")).toBe("hello");
    });

    it("replaces spaces with hyphens", () => {
      expect(slugify("hello world")).toBe("hello-world");
    });

    it("replaces multiple spaces with a single hyphen", () => {
      expect(slugify("hello   world")).toBe("hello-world");
    });

    it("handles strings with mixed case and spaces", () => {
      expect(slugify("Hello Some World ")).toBe("hello-some-world");
    });

    it("returns empty string for empty input", () => {
      expect(slugify("")).toBe("");
    });
  });

  describe("isValidSlug", () => {
    it("returns true for valid slugs", () => {
      expect(isValidSlug("hello-world")).toBe(true);
      expect(isValidSlug("hello")).toBe(true);
      expect(isValidSlug("hello-123")).toBe(true);
    });

    it("returns false for slugs with uppercase letters", () => {
      expect(isValidSlug("Hello-world")).toBe(false);
    });

    it("returns false for slugs with spaces", () => {
      expect(isValidSlug("hello world")).toBe(false);
    });

    it("returns false for slugs with special characters", () => {
      expect(isValidSlug("hello_world")).toBe(false);
      expect(isValidSlug("hello@world")).toBe(false);
    });

    it("returns false for slugs with consecutive hyphens", () => {
      expect(isValidSlug("hello--world")).toBe(false);
    });

    it("returns false for slugs starting or ending with hyphens", () => {
      expect(isValidSlug("-hello-world")).toBe(false);
      expect(isValidSlug("hello-world-")).toBe(false);
    });

    it("returns true for slugs with numbers", () => {
      expect(isValidSlug("hello123")).toBe(true);
      expect(isValidSlug("123-hello")).toBe(true);
    });
  });
}
