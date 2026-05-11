/** Prevents open redirect attacks: rejects non-relative paths. */
export function safeRedirect(to: string | undefined, fallback = "/home"): string {
	if (!to || typeof to !== "string") return fallback;

	if (!to.startsWith("/") || to.startsWith("//")) return fallback;

	// /\evil.com is interpreted as external URL on some browsers
	if (to.startsWith("/\\")) return fallback;

	return to;
}
