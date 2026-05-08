import { ORPCError } from "@orpc/server";
import { HttpError } from "@workspace/shared/errors";

/**
 * Boundary helper: services return `T | Error`, but oRPC procedures must
 * either return a value or throw. `unwrap` is the single point where we
 * convert error-returns into thrown errors at the route layer.
 *
 * Procedures call: `const org = unwrap(await orgsService.create(...));`
 *
 * Return type uses `Exclude<T, Error>` so TS narrows to the success
 * variant after the error subclasses (which all extend Error) are
 * filtered out.
 *
 * Errors that extend `ORPCError` are thrown as-is (they carry their own
 * status/data). Errors extending `HttpError` (the shared, browser-safe
 * base — see `@workspace/shared/errors`) are translated here so the
 * shared package can stay free of `@orpc/server`. Anything else bubbles
 * up as 500 via oRPC's default mapping.
 */
export function unwrap<T>(result: T): Exclude<T, Error> {
	if (result instanceof HttpError) {
		throw new ORPCError(result.code, { message: result.message });
	}
	if (result instanceof Error) throw result;
	return result as Exclude<T, Error>;
}
