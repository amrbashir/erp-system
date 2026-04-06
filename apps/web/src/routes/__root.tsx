import { useEffect, useState } from "react";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from "@tanstack/react-router";
import { getLocale, getTextDirection } from "@workspace/i18n";

import { LanguageSwitcher } from "../components/language-switcher";
import { ActivationScreen } from "../components/activation-screen";
import {
	isDesktop,
	checkActivationState,
	type ActivationState,
} from "../lib/activation";
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

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang={getLocale()} dir={getTextDirection()}>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootLayout() {
	const [activation, setActivation] = useState<ActivationState>(
		isDesktop() ? { status: "loading" } : { status: "not_desktop" },
	);

	useEffect(() => {
		if (!isDesktop()) return;
		checkActivationState().then(setActivation);
	}, []);

	if (activation.status === "loading") {
		return null;
	}

	if (activation.status === "not_activated") {
		return (
			<ActivationScreen
				hardwareId={activation.hardwareId}
				onActivated={() =>
					setActivation({ status: "activated", hardwareId: activation.hardwareId })
				}
			/>
		);
	}

	return (
		<>
			<header className="flex items-center justify-end gap-2 border-b px-4 py-2">
				<LanguageSwitcher />
			</header>
			<Outlet />
		</>
	);
}
