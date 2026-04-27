import { defineEventHandler, readBody, HTTPError } from "h3";

import { useDatabase } from "#db";
import { checkActivation, signActivationToken } from "~/lib/activation";
import { createRateLimiter } from "~/lib/rate-limit";

const limiter = createRateLimiter({ window: 60_000, max: 10 });

export default defineEventHandler(async (event) => {
	if (!limiter(event)) {
		throw new HTTPError("Too many requests", { status: 429 });
	}

	const body = await readBody<{ hardwareId?: string }>(event);

	if (!body?.hardwareId || typeof body.hardwareId !== "string") {
		throw new HTTPError("hardwareId is required", { status: 400 });
	}

	const db = useDatabase();
	const result = await checkActivation(db, body.hardwareId);

	if (result.status !== "active") {
		throw new HTTPError("not_activated", { status: 403, data: { status: result.status } });
	}

	const privateKey = process.env.ACTIVATION_PRIVATE_KEY;
	if (!privateKey) {
		throw new HTTPError("server_misconfigured", { status: 500 });
	}

	const token = await signActivationToken(body.hardwareId, privateKey);
	return { token };
});
