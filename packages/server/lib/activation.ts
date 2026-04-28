import { activations } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";

type DB = PgDatabase<any, any>;

type CheckResult =
	| { status: "active"; activation: typeof activations.$inferSelect }
	| { status: "pending" | "revoked" | "unknown"; activation?: undefined };

type Activation = typeof activations.$inferSelect;

export async function listActivations(db: DB): Promise<Activation[]> {
	return db.select().from(activations).orderBy(activations.createdAt);
}

export async function toggleActivationStatus(
	db: DB,
	id: string,
	status: "active" | "revoked",
): Promise<Activation> {
	const now = new Date();
	const values = {
		status,
		updatedAt: now,
		...(status === "active" && { activatedAt: now }),
	};

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

export async function registerHardware(db: DB, hardwareId: string) {
	const [row] = await db
		.insert(activations)
		.values({ hardwareId })
		.onConflictDoNothing()
		.returning();
	return row;
}

export async function checkActivation(db: DB, hardwareId: string): Promise<CheckResult> {
	const rows = await db
		.select()
		.from(activations)
		.where(eq(activations.hardwareId, hardwareId))
		.limit(1);

	const activation = rows[0];

	if (!activation) {
		return { status: "unknown" };
	}

	if (activation.status !== "active") {
		return { status: activation.status };
	}

	return { status: "active", activation };
}

export async function signActivationToken(
	hardwareId: string,
	privateKeyPem: string,
): Promise<string> {
	const key = await importPKCS8(privateKeyPem, "ES256");
	return new SignJWT({ hardwareId, activated: true })
		.setProtectedHeader({ alg: "ES256" })
		.setIssuedAt()
		.sign(key);
}

export async function verifyActivationToken(
	token: string,
	publicKeyPem: string,
): Promise<{ hardwareId: string; activated: boolean; iat: number }> {
	const key = await importSPKI(publicKeyPem, "ES256");
	const { payload } = await jwtVerify(token, key);
	return payload as { hardwareId: string; activated: boolean; iat: number };
}
