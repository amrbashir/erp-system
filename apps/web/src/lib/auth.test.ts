import { getTestInstance } from "better-auth/test";
import { describe, it, expect, beforeAll } from "vitest";

let client: Awaited<ReturnType<typeof getTestInstance>>["client"];

beforeAll(async () => {
	const instance = await getTestInstance(
		{
			user: {
				additionalFields: {
					username: { type: "string", required: false },
					phone: { type: "string", required: false },
				},
			},
			emailAndPassword: { enabled: true },
		},
		{ disableTestUser: true },
	);
	client = instance.client;
});

describe("signup", () => {
	it("creates user with email + password", async () => {
		const { data, error } = await client.signUp.email({
			name: "Test User",
			email: "test@example.com",
			password: "password123",
		});
		expect(error).toBeNull();
		expect(data?.user.email).toBe("test@example.com");
		expect(data?.user.name).toBe("Test User");
		expect(data?.token).toBeTruthy();
	});
});

describe("login", () => {
	it("returns session with valid credentials", async () => {
		const { data, error } = await client.signIn.email({
			email: "test@example.com",
			password: "password123",
		});
		expect(error).toBeNull();
		expect(data?.token).toBeTruthy();
		expect(data?.user.email).toBe("test@example.com");
	});

	it("rejects invalid credentials", async () => {
		const { data, error } = await client.signIn.email({
			email: "test@example.com",
			password: "wrongpassword",
		});
		expect(error).toBeTruthy();
		expect(data).toBeNull();
	});
});

describe("logout", () => {
	it("invalidates session", async () => {
		const { data: signInData } = await client.signIn.email({
			email: "test@example.com",
			password: "password123",
		});
		expect(signInData?.user).toBeTruthy();

		await client.signOut();

		const { data: sessionData } = await client.getSession();
		expect(sessionData).toBeNull();
	});
});
