import { defineMiddleware } from "nitro";

import { DESKTOP_TRUSTED_ORIGINS } from "../lib/desktop-origins.js";

// Short-circuit CORS preflight for trusted desktop origins so the request
// never reaches a route handler that might 404 or fail validation. The
// actual `Access-Control-*` headers are added in `plugins/cors.ts` via the
// `response` hook (so they survive Response objects returned by routes).
export default defineMiddleware((event) => {
	if (event.req.method !== "OPTIONS") return;
	const origin = event.req.headers.get("origin");
	if (!origin || !DESKTOP_TRUSTED_ORIGINS.has(origin)) return;
	event.res.status = 204;
	return "";
});
