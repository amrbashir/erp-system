import { createServerFn } from "@tanstack/react-start";
import { ActivationsService } from "@workspace/server/activations/activations.service";

import { useDatabase } from "#db";

// Singleton: admin is in-process with the DB, so a single service instance is
// safe to reuse across server-fn invocations.
const svc = new ActivationsService({ db: useDatabase() });

export const getActivations = createServerFn({ method: "GET" }).handler(async () => {
	return svc.list();
});

export const toggleActivation = createServerFn({ method: "POST" })
	.inputValidator((d: { id: string; status: "active" | "revoked" }) => d)
	.handler(async ({ data }) => {
		const result = await svc.toggleStatus(data.id, data.status);
		// errors are returned, not thrown — surface them across the server-fn boundary.
		if (result instanceof Error) throw result;
		return result;
	});
