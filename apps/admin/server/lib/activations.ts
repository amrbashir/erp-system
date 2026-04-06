import { eq } from "drizzle-orm";
import { activations } from "@workspace/db/schema";

type Activation = typeof activations.$inferSelect;

export async function listActivations(db: any): Promise<Activation[]> {
	return db.select().from(activations).orderBy(activations.createdAt);
}

export async function toggleActivationStatus(
	db: any,
	id: string,
	status: "active" | "revoked",
): Promise<Activation> {
	const values: Record<string, unknown> = {
		status,
		updatedAt: new Date(),
	};

	if (status === "active") {
		values.activatedAt = new Date();
	}

	const [updated] = await db
		.update(activations)
		.set(values)
		.where(eq(activations.id, id))
		.returning();

	if (!updated) {
		throw new Error(`Activation ${id} not found`);
	}

	return updated;
}
