import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const orgs = pgTable("orgs", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	defaultCurrency: text("default_currency").notNull().default("USD"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});
