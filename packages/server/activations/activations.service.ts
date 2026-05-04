import { activations } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT, importPKCS8, importSPKI, jwtVerify } from "jose";

import type { DB } from "../shared/db.js";
import {
	ActivationNotFoundError,
	InvalidTokenError,
	ServerMisconfiguredError,
} from "../shared/errors.js";
type Activation = typeof activations.$inferSelect;

/** Public-facing check result, mirroring the original HTTP route surface. */
export type CheckResult = { token: string } | { status: "pending" | "revoked" };

/**
 * Owns the `activations` table + ES256 JWT signing/verification used by
 * the desktop activation handshake.
 *
 * `privateKey` is constructor-injected so the procedure layer doesn't
 * read env directly. Pass `undefined` in tests / local dev where signing
 * is not configured — `checkAndIssue` returns `ServerMisconfiguredError`
 * if a token would otherwise be required.
 */
export class ActivationsService {
	constructor(private readonly deps: { db: DB; privateKey?: string }) {}

	async list(): Promise<Activation[]> {
		return this.deps.db.select().from(activations).orderBy(activations.createdAt);
	}

	async toggleStatus(
		id: string,
		status: "active" | "revoked",
	): Promise<ActivationNotFoundError | Activation> {
		const now = new Date();
		const [updated] = await this.deps.db
			.update(activations)
			.set({
				status,
				updatedAt: now,
				...(status === "active" && { activatedAt: now }),
			})
			.where(eq(activations.id, id))
			.returning();

		if (!updated) return new ActivationNotFoundError({ id });
		return updated;
	}

	/**
	 * Combined check + auto-register + sign flow used by the desktop
	 * client. Unknown hardware is registered as `pending` so the admin
	 * dashboard can later approve it.
	 */
	async checkAndIssue(
		hardwareId: string,
	): Promise<ServerMisconfiguredError | InvalidTokenError | CheckResult> {
		const result = await this.check(hardwareId);

		if (result.status === "unknown") {
			await this.register(hardwareId);
			return { status: "pending" };
		}
		if (result.status !== "active") {
			return { status: result.status };
		}

		if (!this.deps.privateKey) {
			return new ServerMisconfiguredError({ reason: "ACTIVATION_PRIVATE_KEY missing" });
		}
		const token = await signActivationToken(hardwareId, this.deps.privateKey);
		if (token instanceof Error) return token;
		return { token };
	}

	async check(
		hardwareId: string,
	): Promise<
		| { status: "active"; activation: Activation }
		| { status: "pending" | "revoked" | "unknown" }
	> {
		const [row] = await this.deps.db
			.select()
			.from(activations)
			.where(eq(activations.hardwareId, hardwareId))
			.limit(1);

		if (!row) return { status: "unknown" };
		if (row.status !== "active") return { status: row.status };
		return { status: "active", activation: row };
	}

	async register(hardwareId: string): Promise<Activation | undefined> {
		const [row] = await this.deps.db
			.insert(activations)
			.values({ hardwareId })
			.onConflictDoNothing()
			.returning();
		return row;
	}
}

// ── Pure JWT helpers (no DB) — exported for tests + the legacy lib shim ─────

export async function signActivationToken(
	hardwareId: string,
	privateKeyPem: string,
): Promise<InvalidTokenError | string> {
	const key = await importPKCS8(privateKeyPem, "ES256").catch((e: Error) => e);
	if (key instanceof Error) {
		return new InvalidTokenError({ reason: key.message, cause: key });
	}
	const signed = await new SignJWT({ hardwareId, activated: true })
		.setProtectedHeader({ alg: "ES256" })
		.setIssuedAt()
		.sign(key)
		.catch((e: Error) => e);
	if (signed instanceof Error) {
		return new InvalidTokenError({ reason: signed.message, cause: signed });
	}
	return signed;
}

export async function verifyActivationToken(
	token: string,
	publicKeyPem: string,
): Promise<InvalidTokenError | { hardwareId: string; activated: boolean; iat: number }> {
	const key = await importSPKI(publicKeyPem, "ES256").catch((e: Error) => e);
	if (key instanceof Error) {
		return new InvalidTokenError({ reason: key.message, cause: key });
	}
	const verified = await jwtVerify(token, key).catch((e: Error) => e);
	if (verified instanceof Error) {
		return new InvalidTokenError({ reason: verified.message, cause: verified });
	}
	return verified.payload as { hardwareId: string; activated: boolean; iat: number };
}
