import { createAuthClient } from "better-auth/react";

import { isDesktop } from "./activation";
import { SIDECAR_URL } from "./sidecar";

const TOKEN_KEY = "bearer_token";

const desktop = isDesktop();

export const authClient = createAuthClient({
	baseURL: desktop ? SIDECAR_URL : undefined,
	fetchOptions: desktop
		? {
				auth: {
					type: "Bearer",
					token: () =>
						(typeof localStorage !== "undefined"
							? localStorage.getItem(TOKEN_KEY)
							: null) ?? "",
				},
				onSuccess: (ctx) => {
					const token = ctx.response.headers.get("set-auth-token");
					if (token && typeof localStorage !== "undefined") {
						localStorage.setItem(TOKEN_KEY, token);
					}
				},
			}
		: undefined,
});

export const { useSession, signIn, signUp, signOut } = authClient;
