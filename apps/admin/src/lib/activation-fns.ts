import { createServerFn } from "@tanstack/react-start";
import { useDatabase } from "#db";
import { listActivations, toggleActivationStatus } from "@workspace/server/lib/activation";

export const getActivations = createServerFn({ method: "GET" }).handler(async () => {
	const db = useDatabase();
	return listActivations(db);
});

export const toggleActivation = createServerFn({ method: "POST" })
	.inputValidator((d: { id: string; status: "active" | "revoked" }) => d)
	.handler(async ({ data }) => {
		const db = useDatabase();
		return toggleActivationStatus(db, data.id, data.status);
	});
