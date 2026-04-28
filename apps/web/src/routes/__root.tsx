import { CircleNotch } from "@phosphor-icons/react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { getLocale, getTextDirection } from "@workspace/i18n";
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
	| { step: "ready" };

function RootLayout() {
	const [state, setState] = useState<DesktopState | null>(
		isDesktop() ? { step: "loading" } : null,
	);

	useEffect(() => {
		if (!isDesktop()) return;

		(async () => {
			// check activation first
			const activation = await checkActivationState();
			if (activation.status === "not_activated") {
				setState({ step: "activation", hardwareId: activation.hardwareId });
				return;
			}

			// check auth status
			try {
				const auth = await getDesktopAuthStatus();
				if (!auth.setupComplete) {
					setState({ step: "onboarding" });
				} else if (!auth.loggedIn) {
					setState({ step: "login" });
				} else {
					setState({ step: "ready" });
				}
			} catch {
				// sidecar not ready yet, show login
				if (getStoredToken()) {
					setState({ step: "ready" });
				} else {
					setState({ step: "login" });
				}
			}
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

	if (state.step === "activation") {
		return (
			<ActivationScreen
				hardwareId={state.hardwareId}
				onActivated={async () => {
					try {
						const auth = await getDesktopAuthStatus();
						if (!auth.setupComplete) {
							setState({ step: "onboarding" });
						} else {
							setState({ step: "login" });
						}
					} catch {
						setState({ step: "onboarding" });
					}
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
