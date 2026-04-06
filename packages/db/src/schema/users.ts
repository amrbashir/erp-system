import {
	boolean,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs.ts";

export const users = pgTable("users", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	email: text(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text(),
	username: text(),
	phone: text(),
	orgId: uuid("org_id").references(() => orgs.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
	},
	(t) => [unique().on(t.orgId, t.username)],
);
