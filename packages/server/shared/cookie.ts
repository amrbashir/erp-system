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
