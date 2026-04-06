import {
	pgEnum,
	pgTable,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs.ts";
import { users } from "./users.ts";

export const orgRoleEnum = pgEnum("org_role", ["owner", "admin", "member"]);

export const orgMembers = pgTable(
	"org_members",
	{
		id: uuid().primaryKey().defaultRandom(),
		role: orgRoleEnum().notNull().default("member"),
		orgId: uuid("org_id")
			.notNull()
			.references(() => orgs.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(t) => [unique().on(t.orgId, t.userId)],
);
