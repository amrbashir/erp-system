import { pgTable, index, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

import { orgs } from "./orgs.js";
import { users } from "./users.js";

export const auditLogs = pgTable(
	"audit_logs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orgId: uuid("org_id")
			.notNull()
			.references(() => orgs.id, { onDelete: "cascade" }),
		actorId: uuid("actor_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		action: varchar("action", { length: 100 }).notNull(),
		targetType: varchar("target_type", { length: 50 }),
		targetId: varchar("target_id", { length: 255 }),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("audit_logs_actor_id_idx").on(t.actorId)],
);
