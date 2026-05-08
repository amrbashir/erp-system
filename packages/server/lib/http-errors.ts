import { ORPCError } from "@orpc/server";
import { APIError } from "better-auth";
import { HTTPError } from "h3";

/** Translate a thrown error into an h3 HTTPError for the better-auth nitro route. */
export function toHTTPError(err: unknown): HTTPError {
	if (!(err instanceof Error)) {
		return new HTTPError(typeof err === "string" ? err : "Internal Server Error", {
			status: 500,
		});
	}
	if (err instanceof ORPCError) {
		return new HTTPError(err.message, { status: err.status });
	}
	if (err instanceof APIError) {
		const status = typeof err.statusCode === "number" ? err.statusCode : 500;
		return new HTTPError(err.message, { status });
	}
	return new HTTPError(err.message, { status: 500 });
}
