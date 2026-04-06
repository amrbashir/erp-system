import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import * as schema from "@workspace/db/schema";

const BASE_URL = "http://localhost:3000";

let client: PGlite;
let db: ReturnType<typeof drizzle>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle({ client, schema });
	await migrate(db, { migrationsFolder: "./packages/db/drizzle" });

	auth = betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: {
				user: schema.users,
				session: schema.sessions,
				account: schema.accounts,
				verification: schema.verifications,
			},
		}),
		baseURL: BASE_URL,
		secret: "test-secret-at-least-32-chars-long!!",
		emailAndPassword: { enabled: true },
		advanced: {
			database: { generateId: "uuid" },
		},
		user: {
			additionalFields: {
				username: {
					type: "string",
					required: false,
					input: true,
				},
				phone: {
					type: "string",
					required: false,
					input: true,
				},
				orgId: {
					type: "string",
					required: false,
					input: false,
				},
			},
		},
	});
});

afterAll(async () => {
	await client.close();
});

async function authRequest(path: string, body: Record<string, unknown>) {
	return auth.handler(
		new Request(`${BASE_URL}/api/auth${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

describe("signup", () => {
	test("creates user with email + password", async () => {
		const res = await authRequest("/sign-up/email", {
			email: "alice@example.com",
			password: "password123",
			name: "Alice",
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.user).toBeDefined();
		expect(data.user.email).toBe("alice@example.com");
		expect(data.user.name).toBe("Alice");
	});

	test("creates user with additional fields (username, phone)", async () => {
		const res = await authRequest("/sign-up/email", {
			email: "bob@example.com",
			password: "password123",
			name: "Bob",
			username: "bob",
			phone: "+1234567890",
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.user.username).toBe("bob");
		expect(data.user.phone).toBe("+1234567890");
	});

	test("rejects duplicate email", async () => {
		const res = await authRequest("/sign-up/email", {
			email: "alice@example.com",
			password: "password123",
			name: "Alice2",
		});
		expect(res.status).not.toBe(200);
	});
});

describe("login", () => {
	test("returns session with valid credentials", async () => {
		const res = await authRequest("/sign-in/email", {
			email: "alice@example.com",
			password: "password123",
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		// Better Auth returns { token, user } on sign-in
		expect(data.token || data.session).toBeTruthy();
		expect(data.user).toBeDefined();
		expect(data.user.email).toBe("alice@example.com");
		// Session cookie should be set
		expect(res.headers.get("set-cookie")).toBeTruthy();
	});

	test("rejects invalid password", async () => {
		const res = await authRequest("/sign-in/email", {
			email: "alice@example.com",
			password: "wrong-password",
		});
		expect(res.status).not.toBe(200);
	});

	test("rejects non-existent email", async () => {
		const res = await authRequest("/sign-in/email", {
			email: "nobody@example.com",
			password: "password123",
		});
		expect(res.status).not.toBe(200);
	});
});

describe("logout", () => {
	test("invalidates session", async () => {
		// login first
		const loginRes = await authRequest("/sign-in/email", {
			email: "alice@example.com",
			password: "password123",
		});
		expect(loginRes.status).toBe(200);

		// extract session cookie from set-cookie headers
		const cookies = loginRes.headers.getSetCookie();
		const cookieHeader = cookies.map((c: string) => c.split(";")[0]).join("; ");
		expect(cookieHeader).toBeTruthy();

		// verify session exists
		const sessionRes = await auth.handler(
			new Request(`${BASE_URL}/api/auth/get-session`, {
				headers: { cookie: cookieHeader },
			}),
		);
		const sessionData = await sessionRes.json();
		expect(sessionData?.session).toBeTruthy();

		// logout
		const logoutRes = await auth.handler(
			new Request(`${BASE_URL}/api/auth/sign-out`, {
				method: "POST",
				headers: { cookie: cookieHeader },
			}),
		);
		expect(logoutRes.status).toBe(200);

		// session should be invalid after logout
		const afterRes = await auth.handler(
			new Request(`${BASE_URL}/api/auth/get-session`, {
				headers: { cookie: cookieHeader },
			}),
		);
		const afterData = await afterRes.json();
		expect(afterData?.session).toBeFalsy();
	});
});
