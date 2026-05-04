import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { getLocale, getTextDirection, m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { LanguageSwitcher } from "@workspace/ui/components/language-switcher";
import { ThemeProvider, themeScript } from "@workspace/ui/components/theme-provider";
import { ThemeSwitcher } from "@workspace/ui/components/theme-switcher";

import { DesktopBootstrap } from "@/components/desktop-bootstrap";
import { isDesktop } from "@/lib/activation";

import appCss from "@workspace/ui/globals.css?url";

export interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
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
	errorComponent: ErrorBoundary,
});

function ErrorBoundary({ error, reset }: ErrorComponentProps) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
			<h1 className="text-2xl font-semibold">{m.error_boundary_heading()}</h1>
			<p className="text-muted-foreground max-w-md">{m.error_boundary_description()}</p>
			{error.message ? (
				<pre className="bg-muted text-muted-foreground max-w-full overflow-auto rounded p-3 text-left text-xs">
					{error.message}
				</pre>
			) : null}
			<div className="flex gap-2">
				<Button onClick={reset}>{m.retry()}</Button>
				<Button variant="outline" onClick={() => window.location.reload()}>
					{m.reload()}
				</Button>
			</div>
		</div>
	);
}

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
