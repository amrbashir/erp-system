import { defineMiddleware } from "nitro";

import { DESKTOP_TRUSTED_ORIGINS } from "../lib/desktop-origins.js";

// Short-circuit preflight before any route handler. Actual `Access-Control-*` headers added in `plugins/cors.ts` (response hook so they survive Response objects).
export default defineMiddleware((event) => {
	if (event.req.method !== "OPTIONS") return;
	const origin = event.req.headers.get("origin");
	if (!origin || !DESKTOP_TRUSTED_ORIGINS.has(origin)) return;
	event.res.status = 204;
	return "";
});
