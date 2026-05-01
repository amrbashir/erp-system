import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { getLocale, getTextDirection } from "@workspace/i18n";
import { ThemeProvider, themeScript } from "@workspace/ui/components/theme-provider";

import { DesktopBootstrap } from "@/components/desktop-bootstrap";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { isDesktop } from "@/lib/activation";

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
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body>
				<ThemeProvider>{children}</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}

function Shell() {
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

function RootLayout() {
	if (isDesktop()) {
		return (
			<DesktopBootstrap>
				<Shell />
			</DesktopBootstrap>
		);
	}
	return <Shell />;
}
