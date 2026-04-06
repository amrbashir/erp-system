import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
	detectLocale,
	getLocale,
	getTextDirection,
	m,
	persistLocale,
	setLocale,
	type SupportedLocale,
} from "@workspace/i18n";
import appCss from "@workspace/ui/globals.css?url";

import { LanguageSwitcher } from "@workspace/ui/components/language-switcher";

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
				title: "TanStack Start Starter",
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
	const [locale, setLocaleState] = useState(getLocale);

	useEffect(() => {
		const detected = detectLocale();
		if (detected !== getLocale()) {
			setLocale(detected);
			setLocaleState(detected);
			persistLocale(detected);
		}
	}, []);

	useEffect(() => {
		document.documentElement.lang = locale;
		document.documentElement.dir = getTextDirection();
	}, [locale]);

	function handleSwitch() {
		const next: SupportedLocale = locale === "ar" ? "en" : "ar";
		setLocale(next);
		setLocaleState(next);
		persistLocale(next);
	}

	return (
		<>
			<header className="flex items-center justify-end p-2">
				<LanguageSwitcher
					label={m.language_switcher_label()}
					onSwitch={handleSwitch}
				/>
			</header>
			<Outlet />
		</>
	);
}
