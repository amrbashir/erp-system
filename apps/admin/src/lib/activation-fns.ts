import { createServerFn } from "@tanstack/react-start";
import { listActivations, toggleActivationStatus } from "@workspace/server/lib/activation";

import { useDatabase } from "#db";

export const getActivations = createServerFn({ method: "GET" }).handler(async () => {
	const db = useDatabase();
	return listActivations(db);
});

export const toggleActivation = createServerFn({ method: "POST" })
	.inputValidator((d: { id: string; status: "active" | "revoked" }) => d)
	.handler(async ({ data }) => {
		const db = useDatabase();
		const result = await toggleActivationStatus(db, data.id, data.status);
		// errors are returned, not thrown — surface them across the server-fn boundary.
		if (result instanceof Error) throw result;
		return result;
	});
