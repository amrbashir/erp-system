import { pgTable, uniqueIndex, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

import { lower } from "../utils.js";

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(),
		email: varchar("email", { length: 255 }).notNull(),
		emailVerified: boolean("email_verified").notNull().default(false),
		image: varchar("image", { length: 2048 }),
		phone: varchar("phone", { length: 50 }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [uniqueIndex("emailUniqueIndex").on(lower(table.email))],
);
