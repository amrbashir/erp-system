import type { CommonORPCErrorCode } from "@orpc/client";
import * as errore from "errore";

/** Server's `unwrap` rethrows as `ORPCError(code, ...)`. Type-only import keeps this package runtime-free of `@orpc/*`. */
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
