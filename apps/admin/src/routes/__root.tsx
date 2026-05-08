import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { getLocale, getTextDirection } from "@workspace/i18n";
import { LanguageSwitcher } from "@workspace/ui/components/language-switcher";
import { NotFound } from "@workspace/ui/components/not-found";
import { ThemeProvider, themeScript } from "@workspace/ui/components/theme-provider";
import { ThemeSwitcher } from "@workspace/ui/components/theme-switcher";

import appCss from "@workspace/ui/globals.css?url";

export interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
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
	notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { queryClient } = Route.useRouteContext();
	return (
		<html lang={getLocale()} dir={getTextDirection()}>
			<head>
				<HeadContent />
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>
					<ThemeProvider>{children}</ThemeProvider>
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	);
}

function RootLayout() {
	return (
		<div className="min-h-screen">
			<header className="flex items-center justify-between border-b px-6 py-3">
				<h1 className="text-lg font-bold">Admin Dashboard</h1>
				<div className="flex items-center gap-2">
					<ThemeSwitcher />
					<LanguageSwitcher />
				</div>
			</header>
			<Outlet />
		</div>
	);
}
