import { defineEventHandler, getHeader, setResponseStatus, setResponseHeader } from "nitro/h3";

export default defineEventHandler((event) => {
	// skip auth for static assets in dev
	const url = event.path ?? "";
	if (!url.startsWith("/api/")) return;

	const auth = getHeader(event, "authorization");
	if (!auth?.startsWith("Basic ")) {
		setResponseStatus(event, 401);
		setResponseHeader(event, "WWW-Authenticate", 'Basic realm="Admin"');
		return "Unauthorized";
	}

	let decoded: string;
	try {
		decoded = atob(auth.slice(6));
	} catch {
		setResponseStatus(event, 401);
		setResponseHeader(event, "WWW-Authenticate", 'Basic realm="Admin"');
		return "Unauthorized";
	}
	const colonIdx = decoded.indexOf(":");
	const user = decoded.slice(0, colonIdx);
	const pass = decoded.slice(colonIdx + 1);

	const adminUser = process.env.ADMIN_USERNAME || "admin";
	const adminPass = process.env.ADMIN_PASSWORD;

	if (!adminPass || user !== adminUser || pass !== adminPass) {
		setResponseStatus(event, 401);
		setResponseHeader(event, "WWW-Authenticate", 'Basic realm="Admin"');
		return "Unauthorized";
	}
});
