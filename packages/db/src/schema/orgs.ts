import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const orgs = pgTable("orgs", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull().unique(),
	defaultCurrency: varchar("default_currency", { length: 3 }).notNull().default("USD"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
