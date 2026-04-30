import { defineEventHandler } from "h3";

import { auth } from "~/lib/auth";
import { toHTTPError } from "~/lib/http-errors";

export default defineEventHandler(async (event) => {
	const result = await auth.handler(event.req).catch((e: Error) => e);
	if (result instanceof Error) throw toHTTPError(result);
	return result;
});
