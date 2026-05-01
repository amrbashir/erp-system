import { pgTable, uniqueIndex, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

import { lower } from "../utils.js";
import { orgs } from "./orgs.js";
import { roleEnum } from "./org-members.js";
import { users } from "./users.js";

export const invitations = pgTable(
	"invitations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orgId: uuid("org_id")
			.notNull()
			.references(() => orgs.id, { onDelete: "cascade" }),
		email: varchar("email", { length: 255 }).notNull(),
		role: roleEnum("role").notNull().default("member"),
		invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [uniqueIndex("invitations_org_email_unique").on(t.orgId, lower(t.email))],
);
