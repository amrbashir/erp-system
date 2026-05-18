import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { runDesktopGate } from "@workspace/desktop/gate";
import { getLocale, getTextDirection, m } from "@workspace/i18n";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@workspace/ui/components/empty";
import { NotFound } from "@workspace/ui/components/not-found";
import { Spinner } from "@workspace/ui/components/spinner";
import { ThemeProvider, themeScript } from "@workspace/ui/components/theme-provider";
import { TooltipProvider } from "@workspace/ui/components/tooltip";

import { PublicLayout } from "@/layouts/public";

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
				title: "Kaname ERP",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
		],
	}),
	beforeLoad: ({ context, location }) =>
		runDesktopGate({ queryClient: context.queryClient, pathname: location.pathname }),
	shellComponent: RootDocument,
	component: Outlet,
	errorComponent: ErrorBoundary,
	notFoundComponent: NotFoundWithHeader,
	pendingMs: 0,
	pendingComponent: BootPending,
});

function NotFoundWithHeader() {
	return (
		<PublicLayout>
			<div className="flex flex-1 items-center justify-center">
				<NotFound />
			</div>
		</PublicLayout>
	);
}

function ErrorBoundary({ error, reset }: ErrorComponentProps) {
	return (
		<PublicLayout>
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
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
		</PublicLayout>
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
			<body className="flex min-h-svh flex-col">
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

function BootPending() {
	return (
		<Empty className="min-h-svh">
			<EmptyHeader>
				<EmptyMedia>
					<Spinner className="size-6" />
				</EmptyMedia>
				<EmptyTitle className="text-muted-foreground font-normal">
					{m.desktop_starting()}
				</EmptyTitle>
			</EmptyHeader>
		</Empty>
	);
}
