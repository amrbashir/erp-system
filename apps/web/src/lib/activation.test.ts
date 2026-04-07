import { generateKeyPair, exportPKCS8, exportSPKI, SignJWT, importPKCS8 } from "jose";
import { describe, it, expect, beforeAll } from "vitest";

import { verifyTokenOffline } from "./activation-verify";

let privateKeyPem: string;
let publicKeyPem: string;

beforeAll(async () => {
	const kp = await generateKeyPair("ES256", { extractable: true });
	privateKeyPem = await exportPKCS8(kp.privateKey);
	publicKeyPem = await exportSPKI(kp.publicKey);
});

async function signToken(hardwareId: string): Promise<string> {
	const key = await importPKCS8(privateKeyPem, "ES256");
	return new SignJWT({ hardwareId, activated: true })
		.setProtectedHeader({ alg: "ES256" })
		.setIssuedAt()
		.sign(key);
}

describe("verifyTokenOffline", () => {
	it("returns payload for valid token", async () => {
		const token = await signToken("hw-001");
		const result = await verifyTokenOffline(token, publicKeyPem);
		expect(result).not.toBeNull();
		expect(result!.hardwareId).toBe("hw-001");
		expect(result!.activated).toBe(true);
	});

	it("returns null for tampered token", async () => {
		const token = await signToken("hw-001");
		const tampered = token.slice(0, -5) + "XXXXX";
		const result = await verifyTokenOffline(tampered, publicKeyPem);
		expect(result).toBeNull();
	});

	it("returns null for token signed with different key", async () => {
		const otherKp = await generateKeyPair("ES256", { extractable: true });
		const otherPrivate = await exportPKCS8(otherKp.privateKey);
		const otherKey = await importPKCS8(otherPrivate, "ES256");
		const token = await new SignJWT({ hardwareId: "hw-001", activated: true })
			.setProtectedHeader({ alg: "ES256" })
			.setIssuedAt()
			.sign(otherKey);

		const result = await verifyTokenOffline(token, publicKeyPem);
		expect(result).toBeNull();
	});

	it("returns null for token with activated=false", async () => {
		const key = await importPKCS8(privateKeyPem, "ES256");
		const token = await new SignJWT({ hardwareId: "hw-001", activated: false })
			.setProtectedHeader({ alg: "ES256" })
			.setIssuedAt()
			.sign(key);

		const result = await verifyTokenOffline(token, publicKeyPem);
		expect(result).toBeNull();
	});

	it("returns null for garbage input", async () => {
		const result = await verifyTokenOffline("not-a-jwt", publicKeyPem);
		expect(result).toBeNull();
	});
});
