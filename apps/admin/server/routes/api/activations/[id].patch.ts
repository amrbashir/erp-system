import { defineEventHandler, readBody, setResponseStatus, getRouterParam } from "nitro/h3";

import { toggleActivationStatus } from "../../../lib/activations.js";
import { useDB } from "../../../utils/db.js";

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, "id");
	if (!id) {
		setResponseStatus(event, 400);
		return { error: "id is required" };
	}

	const body = await readBody<{ status?: string }>(event);
	if (!body?.status || !["active", "revoked"].includes(body.status)) {
		setResponseStatus(event, 400);
		return { error: "status must be 'active' or 'revoked'" };
	}

	const db = useDB();

	try {
		const updated = await toggleActivationStatus(db, id, body.status as "active" | "revoked");
		return updated;
	} catch {
		setResponseStatus(event, 404);
		return { error: "activation not found" };
	}
});
