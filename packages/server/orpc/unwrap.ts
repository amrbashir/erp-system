/**
 * Boundary helper: services return `T | Error`, but oRPC procedures must
 * either return a value or throw. `unwrap` is the single point where we
 * convert error-returns into thrown errors at the route layer.
 *
 * Procedures call: `const org = unwrap(await orgsService.create(...));`
 *
 * Errors that extend `ORPCError` carry their own status/data; non-ORPC
 * errors bubble up as 500 (handler converts via oRPC's default mapping).
 */
export function unwrap<T>(result: T | Error): T {
	if (result instanceof Error) throw result;
	return result;
}
