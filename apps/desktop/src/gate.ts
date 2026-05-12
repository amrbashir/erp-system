import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { m } from "@workspace/i18n";

import { IS_DESKTOP } from "./index";
import { type ActivationState, checkActivationState } from "./lib/activation";
import { getSetupComplete, waitForSidecar } from "./lib/sidecar";

export type { ActivationState };

export const desktopQueryKeys = {
	all: ["desktop"] as const,
	activation: ["desktop", "activation"] as const,
	sidecarReady: ["desktop", "sidecar-ready"] as const,
	setupComplete: ["desktop", "setup-complete"] as const,
};

/**
 * Desktop boot gate. Runs in `__root.tsx` `beforeLoad`. Throws `redirect` to
 * `/activation` or `/setup` until both are satisfied. Caches each probe in
 * the query client so invalidating after activation/setup re-runs the gate.
 */
export async function runDesktopGate({
	queryClient,
	pathname,
}: {
	queryClient: QueryClient;
	pathname: string;
}): Promise<void> {
	if (!IS_DESKTOP) return;

	const onActivation = pathname === "/activation";
	const onSetup = pathname === "/setup";

	const activation = await queryClient.ensureQueryData<ActivationState>({
		queryKey: desktopQueryKeys.activation,
		queryFn: checkActivationState,
		staleTime: Infinity,
	});

	if (activation.status === "error") throw activation.error;

	// /activation and /setup are runtime-injected (see @workspace/desktop/routes)
	// so `to:` doesn't accept them - use `href:` which is untyped.
	if (activation.status === "not_activated") {
		if (!onActivation) throw redirect({ href: "/activation" });
		return;
	}

	if (onActivation) throw redirect({ to: "/" });

	const ready = await queryClient.ensureQueryData({
		queryKey: desktopQueryKeys.sidecarReady,
		queryFn: () => waitForSidecar(),
		staleTime: Infinity,
	});

	if (!ready) throw new Error(m.desktop_sidecar_timeout());

	const setup = await queryClient.ensureQueryData({
		queryKey: desktopQueryKeys.setupComplete,
		queryFn: getSetupComplete,
		staleTime: Infinity,
	});

	if (!setup.setupComplete) {
		if (!onSetup) throw redirect({ href: "/setup" });
		return;
	}

	if (onSetup) throw redirect({ to: "/" });
}
