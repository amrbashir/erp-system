import { jwtVerify, importSPKI } from "jose";
import * as z from "zod";

import { InvalidTokenError } from "./errors";

const payloadSchema = z.object({
	hardwareId: z.string(),
	activated: z.boolean(),
});

export async function verifyTokenOffline(
	token: string,
	publicKeyPem: string,
): Promise<InvalidTokenError | z.infer<typeof payloadSchema>> {
	const key = await importSPKI(publicKeyPem, "ES256").catch((e: Error) => e);
	if (key instanceof Error) {
		return new InvalidTokenError({ reason: key.message, cause: key });
	}
	const verified = await jwtVerify(token, key).catch((e: Error) => e);
	if (verified instanceof Error) {
		return new InvalidTokenError({ reason: verified.message, cause: verified });
	}
	const parsed = payloadSchema.safeParse(verified.payload);
	if (!parsed.success) {
		return new InvalidTokenError({ reason: "Malformed token payload" });
	}
	if (!parsed.data.activated) {
		return new InvalidTokenError({ reason: "Token not activated" });
	}
	return parsed.data;
}
