/**
 * Converts a string to a URL-friendly slug.
 */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Validates if a string is a valid slug.
 * A valid slug consists of lowercase letters, numbers, and hyphens,
 * and cannot start or end with a hyphen.
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
