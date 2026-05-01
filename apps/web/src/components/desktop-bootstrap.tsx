import { CircleNotch } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { useEffect, useState } from "react";

import { ActivationScreen } from "@/components/activation-screen";
import { DesktopOnboarding } from "@/components/desktop-onboarding";
import { checkActivationState } from "@/lib/activation";
import { getSetupComplete } from "@/lib/desktop-auth";

type State =
	| { step: "loading" }
	| { step: "activation"; hardwareId: string }
	| { step: "onboarding" }
	| { step: "ready" }
	| { step: "error"; message: string };

/**
 * Desktop-only bootstrap gate. Resolves activation + first-run setup before
 * normal routing takes over. On web this component isn't rendered at all —
 * see __root.tsx.
 *
 * Steps:
 *  - loading:    probing activation + setup-complete sidecar endpoints
 *  - activation: hardware not yet activated → ActivationScreen
 *  - onboarding: activated, but no users in DB → atomic first-run setup
 *  - ready:      hand off to children (router/_authed)
 *  - error:      surface failure with retry
 */
export function DesktopBootstrap({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<State>({ step: "loading" });

	useEffect(() => {
		(async () => {
			const activation = await checkActivationState();
			if (activation.status === "error") {
				setState({ step: "error", message: activation.error.message });
				return;
			}
			if (activation.status === "not_activated") {
				setState({ step: "activation", hardwareId: activation.hardwareId });
				return;
			}

			// activated → check whether anyone has signed up yet.
			// login/dashboard/redirects beyond this are driven by better-auth + _authed.
			const probe = await getSetupComplete().catch((e: Error) => e);
			if (probe instanceof Error) {
				setState({ step: "error", message: probe.message });
				return;
			}
			setState(probe.setupComplete ? { step: "ready" } : { step: "onboarding" });
		})();
	}, []);

	if (state.step === "loading") {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<CircleNotch className="text-muted-foreground size-6 animate-spin" />
			</div>
		);
	}

	if (state.step === "error") {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
				<p className="text-destructive text-sm">{state.message}</p>
				<Button variant="outline" size="sm" onClick={() => window.location.reload()}>
					Retry
				</Button>
			</div>
		);
	}

	if (state.step === "activation") {
		return (
			<ActivationScreen
				hardwareId={state.hardwareId}
				onActivated={async () => {
					const probe = await getSetupComplete().catch((e: Error) => e);
					if (probe instanceof Error)
						setState({ step: "error", message: probe.message });
					else setState(probe.setupComplete ? { step: "ready" } : { step: "onboarding" });
				}}
			/>
		);
	}

	if (state.step === "onboarding") {
		return <DesktopOnboarding onComplete={() => setState({ step: "ready" })} />;
	}

	return <>{children}</>;
}
