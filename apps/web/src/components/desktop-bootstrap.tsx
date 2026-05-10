import { m } from "@workspace/i18n";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { useEffect, useState } from "react";

import { ActivationScreen } from "@/components/activation-screen";
import { DesktopOnboarding } from "@/components/desktop-onboarding";
import { checkActivationState } from "@/lib/activation";
import { getSetupComplete, waitForSidecar } from "@/lib/desktop-auth";

type State =
	| { step: "loading" }
	| { step: "activation"; hardwareId: string }
	| { step: "onboarding" }
	| { step: "ready" }
	| { step: "error"; message: string };

/** Desktop bootstrap gate: activation -> first-run setup -> ready. Not rendered on web (see __root.tsx). */
export function DesktopBootstrap({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<State>({ step: "loading" });

	useEffect(() => {
		void (async () => {
			const activation = await checkActivationState();
			if (activation.status === "error") {
				setState({ step: "error", message: activation.error.message });
				return;
			}
			if (activation.status === "not_activated") {
				setState({ step: "activation", hardwareId: activation.hardwareId });
				return;
			}

			// Sidecar must bind port + finish migrations before /api calls - first-launch race otherwise.
			const ready = await waitForSidecar();
			if (!ready) {
				setState({
					step: "error",
					message: "Sidecar didn't become ready in time.",
				});
				return;
			}

			// Beyond this, _authed drives redirects.
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
				<Spinner className="size-6" />
			</div>
		);
	}

	if (state.step === "error") {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
				<Alert variant="destructive" className="max-w-md">
					<AlertDescription>{state.message}</AlertDescription>
				</Alert>
				<Button variant="outline" size="sm" onClick={() => window.location.reload()}>
					{m.retry()}
				</Button>
			</div>
		);
	}

	if (state.step === "activation") {
		return (
			<ActivationScreen
				hardwareId={state.hardwareId}
				onActivated={async () => {
					const ready = await waitForSidecar();
					if (!ready) {
						setState({ step: "error", message: "Sidecar didn't become ready in time." });
						return;
					}
					const probe = await getSetupComplete().catch((e: Error) => e);
					if (probe instanceof Error) setState({ step: "error", message: probe.message });
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
