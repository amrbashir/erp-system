import { jwtVerify, importSPKI } from "jose";

export async function verifyTokenOffline(
	token: string,
	publicKeyPem: string,
): Promise<{ hardwareId: string; activated: boolean } | null> {
	try {
		const key = await importSPKI(publicKeyPem, "ES256");
		const { payload } = await jwtVerify(token, key);
		const p = payload as { hardwareId: string; activated: boolean };
		if (p.activated) return p;
		return null;
	} catch {
		return null;
	}
}
