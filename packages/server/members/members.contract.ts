import { oc } from "@orpc/contract";
import * as z from "zod";

const roleEnum = z.enum(["owner", "admin", "member"]);
const orgPathInput = z.object({ orgSlug: z.string() });

export const memberAddBody = z.object({ email: z.email(), role: roleEnum });

const memberOutput = z.object({
	id: z.string(),
	userId: z.string(),
	orgId: z.string(),
	role: roleEnum,
	userName: z.string(),
	userEmail: z.string(),
	createdAt: z.union([z.string(), z.date()]),
});

const invitationOutput = z.object({
	id: z.string(),
	orgId: z.string(),
	email: z.string(),
	role: roleEnum,
	invitedBy: z.string().nullable(),
	createdAt: z.union([z.string(), z.date()]),
	expiresAt: z.union([z.string(), z.date()]),
});

const membersListOutput = z.object({
	members: z.array(memberOutput.extend({ kind: z.literal("member") })),
	invitations: z.array(invitationOutput.extend({ kind: z.literal("invitation") })),
});

export const membersContract = {
	list: oc
		.route({ method: "GET", path: "/orgs/{orgSlug}/members" })
		.input(orgPathInput)
		.output(membersListOutput),
	add: oc
		.route({ method: "POST", path: "/orgs/{orgSlug}/members" })
		.input(orgPathInput.extend(memberAddBody.shape)),
	updateRole: oc
		.route({ method: "PATCH", path: "/orgs/{orgSlug}/members/{memberId}" })
		.input(orgPathInput.extend({ memberId: z.uuid(), role: roleEnum })),
	remove: oc
		.route({ method: "DELETE", path: "/orgs/{orgSlug}/members/{memberId}" })
		.input(orgPathInput.extend({ memberId: z.uuid() })),
	transferOwnership: oc
		.route({ method: "POST", path: "/orgs/{orgSlug}/members/transfer-ownership" })
		.input(
			orgPathInput.extend({
				targetMemberId: z.uuid(),
				newActorRole: z.enum(["admin", "member"]),
			}),
		),
};
