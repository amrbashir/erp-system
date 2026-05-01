import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { ThemeProvider, themeScript } from "@workspace/ui/components/theme-provider";
import { ThemeSwitcher } from "@workspace/ui/components/theme-switcher";

import appCss from "@workspace/ui/globals.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Admin Dashboard" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
	component: RootLayout,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
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

function RootLayout() {
	return (
		<div className="bg-background text-foreground min-h-screen">
			<header className="border-border flex items-center justify-between border-b px-6 py-3">
				<h1 className="text-lg font-bold">Admin Dashboard</h1>
				<ThemeSwitcher label={m.theme_switcher_label()} />
			</header>
			<Outlet />
		</div>
	);
}
