import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const activations = pgTable("activations", {
	id: uuid().primaryKey().defaultRandom(),
	hardwareId: text("hardware_id").notNull().unique(),
	status: text().notNull().default("pending"),
	activatedAt: timestamp("activated_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
});
