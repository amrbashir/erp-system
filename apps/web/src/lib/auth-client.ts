import { createAuthClient } from "better-auth/react";

import { isDesktop } from "./activation";
import { SIDECAR_URL } from "./sidecar";

const desktop = isDesktop();

export const authClient = createAuthClient({
	baseURL: desktop ? SIDECAR_URL : undefined,
	// Desktop talks to the sidecar across origins (tauri://localhost ↔
	// http://localhost:11435), so cookies need to ride explicitly. Server
	// sets SameSite=None+Secure+Partitioned for these cookies.
	fetchOptions: desktop ? { credentials: "include" } : undefined,
});

export const { useSession, signIn, signUp, signOut } = authClient;
