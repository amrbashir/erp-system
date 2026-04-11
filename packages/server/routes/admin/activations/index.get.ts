import { defineEventHandler, toRequest } from "h3";

import { auth } from "#auth";
import { useDatabase } from "#db";

import { listActivations } from "../../../lib/activation";
import { assertAdmin } from "../../../lib/admin";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	assertAdmin(session);

	const db = useDatabase();
	return listActivations(db);
});
