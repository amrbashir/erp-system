import { pgTable, pgEnum, uuid, timestamp, unique } from "drizzle-orm/pg-core";

import { orgs } from "./orgs.js";
import { users } from "./users.js";

export const roleEnum = pgEnum("member_role", ["owner", "admin", "member"]);

export const orgMembers = pgTable(
	"org_members",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orgId: uuid("org_id")
			.notNull()
			.references(() => orgs.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: roleEnum("role").notNull().default("member"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [unique("org_members_org_id_user_id_unique").on(t.orgId, t.userId)],
);
