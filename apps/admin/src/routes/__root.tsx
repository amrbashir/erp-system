import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

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
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootLayout() {
	return (
		<div className="bg-background text-foreground min-h-screen">
			<header className="border-border border-b px-6 py-3">
				<h1 className="text-lg font-bold">Admin Dashboard</h1>
			</header>
			<Outlet />
		</div>
	);
}
