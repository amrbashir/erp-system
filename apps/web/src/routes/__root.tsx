import { CircleNotch } from "@phosphor-icons/react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { getLocale, getTextDirection } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useEffect, useState } from "react";

import { ActivationScreen } from "@/components/activation-screen";
import { DesktopLogin } from "@/components/desktop-login";
import { DesktopOnboarding } from "@/components/desktop-onboarding";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { isDesktop, checkActivationState } from "@/lib/activation";
import { getDesktopAuthStatus, getStoredToken } from "@/lib/desktop-auth";

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

type DesktopState =
	| { step: "loading" }
	| { step: "activation"; hardwareId: string }
	| { step: "onboarding" }
	| { step: "login" }
	| { step: "ready" }
	| { step: "error"; message: string };

function RootLayout() {
	const [state, setState] = useState<DesktopState | null>(
		isDesktop() ? { step: "loading" } : null,
	);

	useEffect(() => {
		if (!isDesktop()) return;

		(async () => {
			// check activation first
			const activation = await checkActivationState();
			if (activation.status === "error") {
				setState({ step: "error", message: activation.error.message });
				return;
			}
			if (activation.status === "not_activated") {
				setState({ step: "activation", hardwareId: activation.hardwareId });
				return;
			}

			// check auth status
			const auth = await getDesktopAuthStatus().catch((e: Error) => e);
			if (auth instanceof Error) {
				// sidecar not ready yet, fall back on cached token
				setState(getStoredToken() ? { step: "ready" } : { step: "login" });
				return;
			}
			if (!auth.setupComplete) setState({ step: "onboarding" });
			else if (!auth.loggedIn) setState({ step: "login" });
			else setState({ step: "ready" });
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
					const auth = await getDesktopAuthStatus().catch((e: Error) => e);
					if (auth instanceof Error) setState({ step: "onboarding" });
					else setState({ step: auth.setupComplete ? "login" : "onboarding" });
				}}
			/>
		);
	}

	if (state.step === "onboarding") {
		return <DesktopOnboarding onComplete={() => setState({ step: "ready" })} />;
	}

	if (state.step === "login") {
		return <DesktopLogin onLoggedIn={() => setState({ step: "ready" })} />;
	}

	// ready
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
