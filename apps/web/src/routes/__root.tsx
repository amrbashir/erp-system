import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { getLocale, getTextDirection, m } from "@workspace/i18n";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { ThemeProvider, themeScript } from "@workspace/ui/components/theme-provider";
import { TooltipProvider } from "@workspace/ui/components/tooltip";

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
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
			<Alert variant="destructive" className="max-w-md">
				<AlertTitle>{m.error_boundary_heading()}</AlertTitle>
				<AlertDescription>
					<p>{m.error_boundary_description()}</p>
					{error.message ? (
						<pre className="bg-muted max-w-full overflow-auto p-3 text-left font-mono">
							{error.message}
						</pre>
					) : null}
				</AlertDescription>
			</Alert>
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
					<ThemeProvider>
						<TooltipProvider>{children}</TooltipProvider>
					</ThemeProvider>
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	);
}

function RootLayout() {
	if (isDesktop()) {
		return (
			<DesktopBootstrap>
				<Outlet />
			</DesktopBootstrap>
		);
	}
	return <Outlet />;
}
