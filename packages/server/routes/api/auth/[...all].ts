import { useAuth } from "@workspace/server/lib/auth";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
	const result = await useAuth()
		.handler(event.req)
		.catch((e: Error) => e);
	if (result instanceof Error) throw toHTTPError(result);
	return result;
});
