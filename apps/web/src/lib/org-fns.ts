import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useDatabase } from "#db";
import { getUserOrgs } from "@workspace/server/lib/org";

import { auth } from "@workspace/server/lib/auth";

const CURRENT_ORG_COOKIE = "current_org_id";

export const getOrgs = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest();
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw new Error("Unauthorized");
	const db = useDatabase();
	return getUserOrgs(db, session.user.id);
});

export const getCurrentOrgId = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest();
	const cookies = request.headers.get("cookie") ?? "";
	const match = cookies
		.split(";")
		.map((c) => c.trim())
		.find((c) => c.startsWith(`${CURRENT_ORG_COOKIE}=`));
	return match ? match.split("=")[1] : null;
});
