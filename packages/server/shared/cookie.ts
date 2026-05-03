import { parse as parseCookies } from "cookie-es";
import type { CookieSerializeOptions } from "cookie-es";

export function orgSwitchCookieOptions(): CookieSerializeOptions {
	return {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
		secure: process.env.NODE_ENV !== "development",
	};
}

/** Single helper for reading a cookie off a Request — works under SSR + HTTP. */
export function readCookie(request: Request, name: string): string | null {
	const header = request.headers.get("cookie");
	if (!header) return null;
	const jar = parseCookies(header);
	return jar[name] ?? null;
}
