import { pgTable, pgEnum, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: varchar("image", { length: 2048 }),
	role: userRoleEnum("role").notNull().default("user"),
	username: varchar("username", { length: 255 }),
	phone: varchar("phone", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
