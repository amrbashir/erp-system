import { createAuth } from "@workspace/server/lib/auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = createAuth({
	plugins: [tanstackStartCookies()],
});

export type Auth = typeof auth;
