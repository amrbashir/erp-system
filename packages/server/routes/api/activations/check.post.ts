import { defineEventHandler, readBody } from "h3";

import { useDatabase } from "#db";
import { checkActivation, registerHardware, signActivationToken } from "~/lib/activation";
import { InvalidInputError, RateLimitedError, ServerMisconfiguredError } from "~/lib/errors";
import { toHTTPError } from "~/lib/http-errors";
import { createRateLimiter } from "~/lib/rate-limit";

const limiter = createRateLimiter({ window: 60_000, max: 10 });

export default defineEventHandler(async (event) => {
	if (!limiter(event)) {
		throw toHTTPError(new RateLimitedError());
	}

	const body = await readBody<{ hardwareId?: string }>(event);

	if (!body?.hardwareId || typeof body.hardwareId !== "string") {
		throw toHTTPError(new InvalidInputError({ reason: "hardwareId is required" }));
	}

	const db = useDatabase();
	let result = await checkActivation(db, body.hardwareId);

	// auto-register unknown hardware as pending
	if (result.status === "unknown") {
		await registerHardware(db, body.hardwareId);
		result = { status: "pending" };
	}

	if (result.status !== "active") {
		event.res.status = 403;
		return { status: result.status };
	}

	const privateKey = process.env.ACTIVATION_PRIVATE_KEY;
	if (!privateKey) {
		throw toHTTPError(
			new ServerMisconfiguredError({ reason: "ACTIVATION_PRIVATE_KEY missing" }),
		);
	}

	const token = await signActivationToken(body.hardwareId, privateKey);
	if (token instanceof Error) throw toHTTPError(token);
	return { token };
});
