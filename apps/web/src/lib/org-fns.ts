import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const CURRENT_ORG_COOKIE = "current_org_id";

/**
 * SSR-only cookie reader. The web `_authed` loader needs the current
 * org id without going through oRPC (the value is the same `Cookie`
 * header used by the orpc client itself). Server fn keeps it in-process.
 */
export const getCurrentOrgId = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest();
	const cookies = request.headers.get("cookie") ?? "";
	const match = cookies
		.split(";")
		.map((c) => c.trim())
		.find((c) => c.startsWith(`${CURRENT_ORG_COOKIE}=`));
	return match ? match.split("=")[1] : null;
});
