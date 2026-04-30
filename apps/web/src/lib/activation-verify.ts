import { jwtVerify, importSPKI } from "jose";

import { InvalidTokenError } from "./errors";

export async function verifyTokenOffline(
	token: string,
	publicKeyPem: string,
): Promise<InvalidTokenError | { hardwareId: string; activated: boolean }> {
	const key = await importSPKI(publicKeyPem, "ES256").catch((e: Error) => e);
	if (key instanceof Error) {
		return new InvalidTokenError({ reason: key.message, cause: key });
	}
	const verified = await jwtVerify(token, key).catch((e: Error) => e);
	if (verified instanceof Error) {
		return new InvalidTokenError({ reason: verified.message, cause: verified });
	}
	const payload = verified.payload as { hardwareId: string; activated: boolean };
	if (!payload.activated) {
		return new InvalidTokenError({ reason: "Token not activated" });
	}
	return payload;
}
