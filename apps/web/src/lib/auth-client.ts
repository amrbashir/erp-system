import { createAuthClient } from "better-auth/react";

import { isDesktop } from "./activation";
import { getStoredToken, storeToken } from "./api-fetch";
import { SIDECAR_URL } from "./sidecar";

const desktop = isDesktop();

export const authClient = createAuthClient({
	baseURL: desktop ? SIDECAR_URL : undefined,
	fetchOptions: desktop
		? {
				auth: {
					type: "Bearer",
					token: () => getStoredToken() ?? "",
				},
				onSuccess: (ctx) => {
					const token = ctx.response.headers.get("set-auth-token");
					if (token) storeToken(token);
				},
			}
		: undefined,
});

export const { useSession, signIn, signUp, signOut } = authClient;
