import { InvalidSlugError } from "./errors.js";

export function toSlug(name: string): string | null {
	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	return slug || null;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export function validateSlug(slug: string): InvalidSlugError | null {
	if (slug.length < 2 || slug.length > 48) {
		return new InvalidSlugError({ reason: "Slug must be between 2 and 48 characters" });
	}
	if (!SLUG_RE.test(slug)) {
		return new InvalidSlugError({
			reason: "Slug must contain only lowercase letters, numbers, and hyphens, and must start and end with a letter or number",
		});
	}
	return null;
}
