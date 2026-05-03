import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { exportPKCS8, exportSPKI, generateKeyPair } from "jose";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { ActivationNotFoundError, InvalidTokenError } from "../shared/errors.js";

import {
	ActivationsService,
	signActivationToken,
	verifyActivationToken,
} from "./activations.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let TEST_PRIVATE_KEY: string;
let TEST_PUBLIC_KEY: string;

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let svc: ActivationsService;

beforeAll(async () => {
	const kp = await generateKeyPair("ES256", { extractable: true });
	TEST_PRIVATE_KEY = await exportPKCS8(kp.privateKey);
	TEST_PUBLIC_KEY = await exportSPKI(kp.publicKey);

	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });
	svc = new ActivationsService({ db: db as any, privateKey: TEST_PRIVATE_KEY });

	await db.insert(schema.activations).values([
		{ hardwareId: "hw-active-001", status: "active", activatedAt: new Date() },
		{ hardwareId: "hw-pending-001", status: "pending" },
		{ hardwareId: "hw-revoked-001", status: "revoked" },
	]);
});

afterAll(async () => {
	await client.close();
});

describe("ActivationsService.check", () => {
	it("returns active + activation for activated hardware ID", async () => {
		const result = await svc.check("hw-active-001");
		expect(result.status).toBe("active");
		expect(result.status === "active" && result.activation.hardwareId).toBe("hw-active-001");
	});

	it("returns pending for pending hardware ID", async () => {
		const result = await svc.check("hw-pending-001");
		expect(result.status).toBe("pending");
	});

	it("returns revoked for revoked hardware ID", async () => {
		const result = await svc.check("hw-revoked-001");
		expect(result.status).toBe("revoked");
	});

	it("returns unknown for non-existent hardware ID", async () => {
		const result = await svc.check("hw-nonexistent");
		expect(result.status).toBe("unknown");
	});
});

describe("ActivationsService.register", () => {
	it("creates a pending activation for new hardware", async () => {
		const row = await svc.register("hw-new-001");
		expect(row).toBeDefined();
		expect(row!.hardwareId).toBe("hw-new-001");
		expect(row!.status).toBe("pending");

		const check = await svc.check("hw-new-001");
		expect(check.status).toBe("pending");
	});

	it("does nothing for already-registered hardware", async () => {
		const row = await svc.register("hw-active-001");
		expect(row).toBeUndefined();
	});
});

describe("ActivationsService.list", () => {
	it("returns all activations", async () => {
		const result = await svc.list();
		expect(result.length).toBeGreaterThanOrEqual(3);
	});

	it("each activation has expected fields", async () => {
		const result = await svc.list();
		for (const a of result) {
			expect(a.id).toBeDefined();
			expect(a.hardwareId).toBeDefined();
			expect(a.status).toBeDefined();
			expect(a.createdAt).toBeInstanceOf(Date);
		}
	});
});

describe("ActivationsService.toggleStatus", () => {
	it("activates a pending activation", async () => {
		const all = await svc.list();
		const pending = all.find((a) => a.hardwareId === "hw-pending-001")!;
		const updated = await svc.toggleStatus(pending.id, "active");
		if (updated instanceof Error) throw updated;
		expect(updated.status).toBe("active");
		expect(updated.activatedAt).toBeInstanceOf(Date);
	});

	it("revokes an active activation", async () => {
		const all = await svc.list();
		const active = all.find((a) => a.hardwareId === "hw-active-001")!;
		const updated = await svc.toggleStatus(active.id, "revoked");
		if (updated instanceof Error) throw updated;
		expect(updated.status).toBe("revoked");
	});

	it("returns ActivationNotFoundError for non-existent ID", async () => {
		const result = await svc.toggleStatus(
			"00000000-0000-0000-0000-000000000000",
			"active",
		);
		expect(result).toBeInstanceOf(ActivationNotFoundError);
	});
});

describe("ActivationsService.checkAndIssue", () => {
	it("auto-registers unknown hardware as pending", async () => {
		const result = await svc.checkAndIssue("hw-fresh-002");
		expect(result).toEqual({ status: "pending" });

		const check = await svc.check("hw-fresh-002");
		expect(check.status).toBe("pending");
	});

	it("returns status for non-active activations", async () => {
		const result = await svc.checkAndIssue("hw-revoked-001");
		expect(result).toEqual({ status: "revoked" });
	});

	it("returns ServerMisconfiguredError when privateKey missing", async () => {
		const noKeySvc = new ActivationsService({ db: db as any });
		// seed an active row to avoid the not-active early return
		await db.insert(schema.activations).values({
			hardwareId: "hw-active-002",
			status: "active",
			activatedAt: new Date(),
		});
		const result = await noKeySvc.checkAndIssue("hw-active-002");
		expect((result as Error).constructor.name).toBe("ServerMisconfiguredError");
	});
});

describe("JWT signing and verification (ES256)", () => {
	it("signs with private key and verifies with public key", async () => {
		const token = await signActivationToken("hw-active-001", TEST_PRIVATE_KEY);
		expect(typeof token).toBe("string");
		if (token instanceof Error) throw token;

		const payload = await verifyActivationToken(token, TEST_PUBLIC_KEY);
		if (payload instanceof Error) throw payload;
		expect(payload.hardwareId).toBe("hw-active-001");
		expect(payload.activated).toBe(true);
		expect(payload.iat).toBeDefined();
	});

	it("returns InvalidTokenError when verified with wrong public key", async () => {
		const token = await signActivationToken("hw-active-001", TEST_PRIVATE_KEY);
		if (token instanceof Error) throw token;
		const otherKp = await generateKeyPair("ES256", { extractable: true });
		const otherPublic = await exportSPKI(otherKp.publicKey);
		const result = await verifyActivationToken(token, otherPublic);
		expect(result).toBeInstanceOf(InvalidTokenError);
	});

	it("produces different tokens for different hardware IDs", async () => {
		const token1 = await signActivationToken("hw-001", TEST_PRIVATE_KEY);
		const token2 = await signActivationToken("hw-002", TEST_PRIVATE_KEY);
		if (token1 instanceof Error) throw token1;
		if (token2 instanceof Error) throw token2;
		expect(token1).not.toBe(token2);
	});
});
