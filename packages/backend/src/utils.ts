export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
