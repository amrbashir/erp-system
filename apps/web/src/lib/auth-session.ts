import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@workspace/server/lib/auth";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest();
	// auth.api.getSession throws better-auth APIError on failure; treat as no session.
	const session = await auth.api
		.getSession({ headers: request.headers })
		.catch((e: Error) => e);
	if (session instanceof Error) return null;
	return session;
});
