/**
 * Legacy shim: forwards the old function-style API to ActivationsService.
 * The Nitro routes still import from here; will be deleted in Phase 5
 * once those routes are removed.
 */
import type { activations } from "@workspace/db/schema";
import type { PgDatabase } from "drizzle-orm/pg-core";

import {
	ActivationsService,
	signActivationToken as svcSignActivationToken,
	verifyActivationToken as svcVerifyActivationToken,
} from "../activations/activations.service.js";
import type { ActivationNotFoundError, InvalidTokenError } from "../shared/errors.js";

type DB = PgDatabase<any, any>;
type Activation = typeof activations.$inferSelect;

type CheckResult =
	| { status: "active"; activation: Activation }
	| { status: "pending" | "revoked" | "unknown"; activation?: undefined };

export async function listActivations(db: DB): Promise<Activation[]> {
	return new ActivationsService({ db }).list();
}

export async function toggleActivationStatus(
	db: DB,
	id: string,
	status: "active" | "revoked",
): Promise<ActivationNotFoundError | Activation> {
	return new ActivationsService({ db }).toggleStatus(id, status);
}

export async function registerHardware(db: DB, hardwareId: string) {
	return new ActivationsService({ db }).register(hardwareId);
}

export async function checkActivation(db: DB, hardwareId: string): Promise<CheckResult> {
	return new ActivationsService({ db }).check(hardwareId) as Promise<CheckResult>;
}

export async function signActivationToken(
	hardwareId: string,
	privateKeyPem: string,
): Promise<InvalidTokenError | string> {
	return svcSignActivationToken(hardwareId, privateKeyPem);
}

export async function verifyActivationToken(
	token: string,
	publicKeyPem: string,
): Promise<InvalidTokenError | { hardwareId: string; activated: boolean; iat: number }> {
	return svcVerifyActivationToken(token, publicKeyPem);
}
