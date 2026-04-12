import { defineEventHandler, readBody, setResponseStatus } from "h3";

import { useDatabase } from "#db";
import { checkActivation, signActivationToken } from "@/lib/activation";

export default defineEventHandler(async (event) => {
	const body = await readBody<{ hardwareId?: string }>(event);

	if (!body?.hardwareId || typeof body.hardwareId !== "string") {
		setResponseStatus(event, 400);
		return { error: "hardwareId is required" };
	}

	const db = useDatabase();
	const result = await checkActivation(db, body.hardwareId);

	if (result.status !== "active") {
		setResponseStatus(event, 403);
		return { error: "not_activated", status: result.status };
	}

	const privateKey = process.env.ACTIVATION_PRIVATE_KEY;
	if (!privateKey) {
		setResponseStatus(event, 500);
		return { error: "server_misconfigured" };
	}

	const token = await signActivationToken(body.hardwareId, privateKey);
	return { token };
});
