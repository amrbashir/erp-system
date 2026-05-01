import { CircleNotch } from "@phosphor-icons/react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { getLocale, getTextDirection } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useEffect, useState } from "react";

import { ActivationScreen } from "@/components/activation-screen";
import { DesktopOnboarding } from "@/components/desktop-onboarding";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { isDesktop, checkActivationState } from "@/lib/activation";
import { getSetupComplete } from "@/lib/desktop-auth";

import appCss from "@workspace/ui/globals.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "ERP System",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	component: RootLayout,
});

const themeScript = `(function(){var t=localStorage.getItem("theme")||"system";var d=t==="system"?window.matchMedia("(prefers-color-scheme:dark)").matches:t==="dark";if(d)document.documentElement.classList.add("dark")})()`;

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang={getLocale()} dir={getTextDirection()}>
			<head>
				<HeadContent />
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

type DesktopBootstrap =
	| { step: "loading" }
	| { step: "activation"; hardwareId: string }
	| { step: "onboarding" }
	| { step: "ready" }
	| { step: "error"; message: string };

function RootLayout() {
	const [state, setState] = useState<DesktopBootstrap | null>(
		isDesktop() ? { step: "loading" } : null,
	);

	useEffect(() => {
		if (!isDesktop()) return;

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

			// only branch we still gate on the sidecar:
			// no users yet → onboarding; otherwise hand off to normal routing
			// (login/dashboard/redirects are all driven by better-auth + _authed).
			const probe = await getSetupComplete().catch((e: Error) => e);
			if (probe instanceof Error) {
				setState({ step: "error", message: probe.message });
				return;
			}
			setState(probe.setupComplete ? { step: "ready" } : { step: "onboarding" });
		})();
	}, []);

	// web mode — pass through
	if (!state) {
		return (
			<>
				<header className="flex items-center justify-end gap-2 border-b px-4 py-2">
					<ThemeSwitcher />
					<LanguageSwitcher />
				</header>
				<Outlet />
			</>
		);
	}

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

	// ready — normal routes take over
	return (
		<>
			<header className="flex items-center justify-end gap-2 border-b px-4 py-2">
				<ThemeSwitcher />
				<LanguageSwitcher />
			</header>
			<Outlet />
		</>
	);
}
