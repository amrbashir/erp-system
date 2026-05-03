import type { H3Event } from "h3";

/**
 * Flat oRPC context: services are top-level fields (`orgsService`, NOT
 * nested `services.orgs`). Instantiated once at server start in `handler.ts`,
 * passed to every procedure invocation.
 *
 * Service classes are added here as domains migrate (Phase 2+).
 */
export interface AppContext {
	/** Per-request h3 event. Middleware reads cookies/headers from this. */
	event: H3Event;
}
