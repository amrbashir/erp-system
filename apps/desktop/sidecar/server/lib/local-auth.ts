import { eq, and } from "drizzle-orm";
import { users, accounts, orgs, orgMembers, sessions } from "@workspace/db/schema";
import { hashSync, compareSync } from "bcryptjs";
import type { Database } from "../utils/db";

type Role = "owner" | "admin" | "member";

export async function isSetupComplete(db: Database): Promise<boolean> {
	const [row] = await db.select({ id: users.id }).from(users).limit(1);
	return !!row;
}

export async function setupOwner(
	db: Database,
	input: {
		orgName: string;
		orgSlug: string;
		username: string;
		password: string;
		name: string;
	},
) {
	const hash = hashSync(input.password, 10);

	return db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({
				name: input.name,
				username: input.username,
			})
			.returning();

		await tx.insert(accounts).values({
			userId: user.id,
			accountId: user.id,
			providerId: "local",
			password: hash,
		});

		const [org] = await tx
			.insert(orgs)
			.values({ name: input.orgName, slug: input.orgSlug })
			.returning();

		await tx.insert(orgMembers).values({
			orgId: org.id,
			userId: user.id,
			role: "owner",
		});

		const token = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		const [session] = await tx
			.insert(sessions)
			.values({
				userId: user.id,
				token,
				expiresAt,
			})
			.returning();

		return { user, org, session };
	});
}

export async function login(
	db: Database,
	input: { username: string; password: string },
) {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.username, input.username))
		.limit(1);

	if (!user) throw new Error("Invalid credentials");

	const [account] = await db
		.select()
		.from(accounts)
		.where(
			and(
				eq(accounts.userId, user.id),
				eq(accounts.providerId, "local"),
			),
		)
		.limit(1);

	if (!account?.password) throw new Error("Invalid credentials");

	const valid = compareSync(input.password, account.password);
	if (!valid) throw new Error("Invalid credentials");

	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

	const [session] = await db
		.insert(sessions)
		.values({ userId: user.id, token, expiresAt })
		.returning();

	return { user, session };
}

export async function getSessionByToken(db: Database, token: string) {
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.token, token))
		.limit(1);

	if (!session) return null;
	if (session.expiresAt < new Date()) return null;

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, session.userId))
		.limit(1);

	if (!user) return null;

	return { user, session };
}

export async function deleteSession(db: Database, token: string) {
	await db.delete(sessions).where(eq(sessions.token, token));
}

export async function createLocalUser(
	db: Database,
	input: {
		orgId: string;
		username: string;
		password: string;
		name: string;
		role: Role;
		actorRole: Role;
	},
) {
	if (input.actorRole === "member") {
		throw new Error("No permission to create users");
	}
	if (input.actorRole === "admin" && input.role !== "member") {
		throw new Error("No permission to assign this role");
	}

	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, input.username))
		.limit(1);
	if (existing) throw new Error("Username already exists");

	const hash = hashSync(input.password, 10);

	return db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({ name: input.name, username: input.username })
			.returning();

		await tx.insert(accounts).values({
			userId: user.id,
			accountId: user.id,
			providerId: "local",
			password: hash,
		});

		const [membership] = await tx
			.insert(orgMembers)
			.values({ orgId: input.orgId, userId: user.id, role: input.role })
			.returning();

		return { user, membership };
	});
}

export async function getLocalOrgMembers(db: Database, orgId: string) {
	return db
		.select({
			id: orgMembers.id,
			userId: orgMembers.userId,
			orgId: orgMembers.orgId,
			role: orgMembers.role,
			userName: users.name,
			username: users.username,
			createdAt: orgMembers.createdAt,
		})
		.from(orgMembers)
		.innerJoin(users, eq(orgMembers.userId, users.id))
		.where(eq(orgMembers.orgId, orgId));
}

export async function updateLocalMemberRole(
	db: Database,
	input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
		newRole: Role;
	},
) {
	if (input.actorRole === "member") {
		throw new Error("No permission to change roles");
	}
	if (input.actorRole === "admin" && input.newRole !== "member") {
		throw new Error("No permission to assign this role");
	}

	if (input.actorRole === "admin") {
		const [target] = await db
			.select({ role: orgMembers.role })
			.from(orgMembers)
			.where(
				and(
					eq(orgMembers.id, input.memberId),
					eq(orgMembers.orgId, input.orgId),
				),
			)
			.limit(1);

		if (!target) throw new Error("Member not found");
		if (target.role !== "member") {
			throw new Error("No permission to change this member's role");
		}
	}

	const [updated] = await db
		.update(orgMembers)
		.set({ role: input.newRole })
		.where(
			and(
				eq(orgMembers.id, input.memberId),
				eq(orgMembers.orgId, input.orgId),
			),
		)
		.returning();

	if (!updated) throw new Error("Member not found");
	return updated;
}

export async function removeLocalMember(
	db: Database,
	input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
	},
) {
	if (input.actorRole === "member") {
		throw new Error("No permission to remove members");
	}

	if (input.actorRole === "admin") {
		const [target] = await db
			.select({ role: orgMembers.role })
			.from(orgMembers)
			.where(
				and(
					eq(orgMembers.id, input.memberId),
					eq(orgMembers.orgId, input.orgId),
				),
			)
			.limit(1);

		if (!target) throw new Error("Member not found");
		if (target.role !== "member") {
			throw new Error("No permission to remove this member");
		}
	}

	const [deleted] = await db
		.delete(orgMembers)
		.where(
			and(
				eq(orgMembers.id, input.memberId),
				eq(orgMembers.orgId, input.orgId),
			),
		)
		.returning();

	if (!deleted) throw new Error("Member not found");
	return deleted;
}
