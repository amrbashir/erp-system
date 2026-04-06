import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@workspace/db/schema";
import {
	isSetupComplete,
	setupOwner,
	login,
	getSessionByToken,
	createLocalUser,
	getLocalOrgMembers,
	updateLocalMemberRole,
	removeLocalMember,
} from "./local-auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(
	__dirname,
	"../../../../../packages/db/drizzle",
);

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });
});

afterAll(async () => {
	await client.close();
});

describe("isSetupComplete", () => {
	it("returns false when no users exist", async () => {
		expect(await isSetupComplete(db as any)).toBe(false);
	});
});

let ownerToken: string;
let orgId: string;
let ownerId: string;

describe("setupOwner", () => {
	it("creates org, owner user, account, and session", async () => {
		const result = await setupOwner(db as any, {
			orgName: "Test Corp",
			orgSlug: "test-corp",
			username: "admin",
			password: "password123",
			name: "Admin User",
		});

		expect(result.user.name).toBe("Admin User");
		expect(result.user.username).toBe("admin");
		expect(result.org.name).toBe("Test Corp");
		expect(result.org.slug).toBe("test-corp");
		expect(result.session.token).toBeTruthy();

		ownerToken = result.session.token;
		orgId = result.org.id;
		ownerId = result.user.id;
	});

	it("isSetupComplete returns true after setup", async () => {
		expect(await isSetupComplete(db as any)).toBe(true);
	});
});

describe("login", () => {
	it("succeeds with correct credentials", async () => {
		const result = await login(db as any, {
			username: "admin",
			password: "password123",
		});

		expect(result.user.username).toBe("admin");
		expect(result.session.token).toBeTruthy();
	});

	it("fails with wrong password", async () => {
		await expect(
			login(db as any, { username: "admin", password: "wrong" }),
		).rejects.toThrow("Invalid credentials");
	});

	it("fails with nonexistent username", async () => {
		await expect(
			login(db as any, { username: "nobody", password: "password123" }),
		).rejects.toThrow("Invalid credentials");
	});
});

describe("getSessionByToken", () => {
	it("returns user for valid token", async () => {
		const result = await getSessionByToken(db as any, ownerToken);
		expect(result).not.toBeNull();
		expect(result!.user.username).toBe("admin");
	});

	it("returns null for invalid token", async () => {
		const result = await getSessionByToken(db as any, "bogus-token");
		expect(result).toBeNull();
	});
});

describe("createLocalUser", () => {
	it("owner can create a member", async () => {
		const result = await createLocalUser(db as any, {
			orgId,
			username: "member1",
			password: "pass1234",
			name: "Member One",
			role: "member",
			actorRole: "owner",
		});

		expect(result.user.username).toBe("member1");
		expect(result.membership.role).toBe("member");
	});

	it("owner can create an admin", async () => {
		const result = await createLocalUser(db as any, {
			orgId,
			username: "admin2",
			password: "pass1234",
			name: "Admin Two",
			role: "admin",
			actorRole: "owner",
		});

		expect(result.membership.role).toBe("admin");
	});

	it("admin can create a member", async () => {
		const result = await createLocalUser(db as any, {
			orgId,
			username: "member2",
			password: "pass1234",
			name: "Member Two",
			role: "member",
			actorRole: "admin",
		});

		expect(result.membership.role).toBe("member");
	});

	it("admin cannot create an admin", async () => {
		await expect(
			createLocalUser(db as any, {
				orgId,
				username: "admin3",
				password: "pass1234",
				name: "Admin Three",
				role: "admin",
				actorRole: "admin",
			}),
		).rejects.toThrow("No permission");
	});

	it("member cannot create users", async () => {
		await expect(
			createLocalUser(db as any, {
				orgId,
				username: "anyone",
				password: "pass1234",
				name: "Anyone",
				role: "member",
				actorRole: "member",
			}),
		).rejects.toThrow("No permission");
	});

	it("rejects duplicate username", async () => {
		await expect(
			createLocalUser(db as any, {
				orgId,
				username: "member1",
				password: "pass1234",
				name: "Duplicate",
				role: "member",
				actorRole: "owner",
			}),
		).rejects.toThrow();
	});
});

describe("getLocalOrgMembers", () => {
	it("returns all members of the org", async () => {
		const members = await getLocalOrgMembers(db as any, orgId);
		expect(members.length).toBe(4); // owner + member1 + admin2 + member2
		expect(members.some((m) => m.userName === "Admin User")).toBe(true);
		expect(members.some((m) => m.userName === "Member One")).toBe(true);
	});
});

describe("updateLocalMemberRole", () => {
	it("owner can change member to admin", async () => {
		const members = await getLocalOrgMembers(db as any, orgId);
		const member1 = members.find((m) => m.userName === "Member One")!;

		const updated = await updateLocalMemberRole(db as any, {
			memberId: member1.id,
			orgId,
			actorRole: "owner",
			newRole: "admin",
		});

		expect(updated.role).toBe("admin");
	});

	it("admin cannot promote to owner", async () => {
		const members = await getLocalOrgMembers(db as any, orgId);
		const member2 = members.find((m) => m.userName === "Member Two")!;

		await expect(
			updateLocalMemberRole(db as any, {
				memberId: member2.id,
				orgId,
				actorRole: "admin",
				newRole: "owner",
			}),
		).rejects.toThrow("No permission");
	});

	it("member cannot change roles", async () => {
		const members = await getLocalOrgMembers(db as any, orgId);
		const member2 = members.find((m) => m.userName === "Member Two")!;

		await expect(
			updateLocalMemberRole(db as any, {
				memberId: member2.id,
				orgId,
				actorRole: "member",
				newRole: "admin",
			}),
		).rejects.toThrow("No permission");
	});
});

describe("removeLocalMember", () => {
	it("admin cannot remove another admin", async () => {
		const members = await getLocalOrgMembers(db as any, orgId);
		const admin2 = members.find((m) => m.userName === "Admin Two")!;

		await expect(
			removeLocalMember(db as any, {
				memberId: admin2.id,
				orgId,
				actorRole: "admin",
			}),
		).rejects.toThrow("No permission");
	});

	it("owner can remove a member", async () => {
		const members = await getLocalOrgMembers(db as any, orgId);
		const member2 = members.find((m) => m.userName === "Member Two")!;

		const removed = await removeLocalMember(db as any, {
			memberId: member2.id,
			orgId,
			actorRole: "owner",
		});

		expect(removed.id).toBe(member2.id);
	});

	it("member cannot remove anyone", async () => {
		const members = await getLocalOrgMembers(db as any, orgId);
		const admin2 = members.find((m) => m.userName === "Admin Two")!;

		await expect(
			removeLocalMember(db as any, {
				memberId: admin2.id,
				orgId,
				actorRole: "member",
			}),
		).rejects.toThrow("No permission");
	});
});
