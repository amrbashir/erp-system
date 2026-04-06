import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const activationStatusEnum = pgEnum("activation_status", [
	"pending",
	"active",
	"revoked",
]);

export const activations = pgTable("activations", {
	id: uuid("id").primaryKey().defaultRandom(),
	hardwareId: varchar("hardware_id", { length: 255 }).notNull().unique(),
	status: activationStatusEnum("status").notNull().default("pending"),
	activatedAt: timestamp("activated_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
