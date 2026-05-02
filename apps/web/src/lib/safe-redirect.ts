/**
 * Validates a redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with `/`.
 * Returns fallback if the path is invalid.
 */
export function safeRedirect(to: string | undefined, fallback = "/"): string {
	if (!to || typeof to !== "string") return fallback;

	// must start with / and must NOT start with // (protocol-relative URL)
	if (!to.startsWith("/") || to.startsWith("//")) return fallback;

	// block paths that could be interpreted as external URLs
	// e.g. /\evil.com on some browsers
	if (to.startsWith("/\\")) return fallback;

	return to;
}
