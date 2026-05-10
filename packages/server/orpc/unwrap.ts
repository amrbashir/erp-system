import { ORPCError } from "@orpc/server";
import { HttpError } from "@workspace/shared/errors";

/**
 * Services return `T | Error`; oRPC procedures must throw. Translates `HttpError`
 * (shared, browser-safe - keeps `@workspace/shared` free of `@orpc/server`) into
 * `ORPCError`. Other errors bubble as 500.
 */
export function unwrap<T>(result: T): Exclude<T, Error> {
	if (result instanceof HttpError) {
		throw new ORPCError(result.code, { message: result.message });
	}
	if (result instanceof Error) throw result;
	return result as Exclude<T, Error>;
}
