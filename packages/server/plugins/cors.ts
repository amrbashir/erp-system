import { definePlugin } from "nitro";

import { DESKTOP_TRUSTED_ORIGINS } from "../lib/desktop-origins.js";

// Headers set on `event.res.headers` from middleware are wiped when a route
// handler returns a Response object (oRPC does this). The `response` hook
// runs *after* the final Response is built, so headers added here survive.
export default definePlugin((nitroApp) => {
	nitroApp.hooks.hook("response", (res, event) => {
		const origin = event.req.headers.get("origin");
		if (!origin || !DESKTOP_TRUSTED_ORIGINS.has(origin)) return;

		res.headers.set("Access-Control-Allow-Origin", origin);
		res.headers.set("Access-Control-Allow-Credentials", "true");
		res.headers.append("Vary", "Origin");

		if (event.req.method !== "OPTIONS") return;

		res.headers.set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, PATCH, DELETE, OPTIONS",
		);
		res.headers.set(
			"Access-Control-Allow-Headers",
			event.req.headers.get("access-control-request-headers") ?? "*",
		);
		res.headers.set("Access-Control-Max-Age", "86400");
	});
});
