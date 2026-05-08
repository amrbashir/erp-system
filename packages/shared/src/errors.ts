import type { CommonORPCErrorCode } from "@orpc/client";
import * as errore from "errore";

/**
 * Base for shared HTTP-shaped errors. Subclasses set `code` to the
 * appropriate status; the route boundary (server's `unwrap`) detects this
 * base and rethrows as `ORPCError(code, ...)`. Type-only import of the
 * code union keeps `@workspace/shared` runtime-free of `@orpc/*`.
 */
export class HttpError extends Error {
	readonly code: CommonORPCErrorCode = "INTERNAL_SERVER_ERROR";
}

export class InvalidSlugError extends errore.createTaggedError({
	name: "InvalidSlugError",
	message: "$reason",
	extends: HttpError,
}) {
	readonly code = "BAD_REQUEST" as const;
}
