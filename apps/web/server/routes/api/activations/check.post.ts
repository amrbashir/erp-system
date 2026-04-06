import { defineEventHandler, readBody, setResponseStatus } from "nitro/h3";
import { useDB } from "../../../utils/db.js";
import {
	checkActivation,
	signActivationToken,
} from "../../../lib/activation.js";

export default defineEventHandler(async (event) => {
	const body = await readBody<{ hardwareId?: string }>(event);

	if (!body?.hardwareId || typeof body.hardwareId !== "string") {
		setResponseStatus(event, 400);
		return { error: "hardwareId is required" };
	}

	const db = useDB();
	const result = await checkActivation(db, body.hardwareId);

	if (result.status !== "active") {
		setResponseStatus(event, 403);
		return { error: "not_activated", status: result.status };
	}

	const secret = process.env.ACTIVATION_JWT_SECRET;
	if (!secret) {
		setResponseStatus(event, 500);
		return { error: "server_misconfigured" };
	}

	const token = await signActivationToken(body.hardwareId, secret);
	return { token };
});
