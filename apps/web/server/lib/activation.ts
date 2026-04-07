import { activations } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";

type CheckResult =
	| { status: "active"; activation: typeof activations.$inferSelect }
	| { status: "pending" | "revoked" | "unknown"; activation?: undefined };

export async function checkActivation(db: any, hardwareId: string): Promise<CheckResult> {
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
