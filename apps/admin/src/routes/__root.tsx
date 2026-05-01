import { Moon, Sun, Monitor } from "@phosphor-icons/react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { ThemeProvider, useTheme, type Theme } from "@workspace/ui/components/theme-provider";

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

const themeScript = `(function(){var t=localStorage.getItem("theme")||"system";var d=t==="system"?window.matchMedia("(prefers-color-scheme:dark)").matches:t==="dark";if(d)document.documentElement.classList.add("dark")})()`;

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

const themeOrder: Theme[] = ["light", "dark", "system"];
const themeIcons: Record<Theme, React.ReactNode> = {
	light: <Sun />,
	dark: <Moon />,
	system: <Monitor />,
};

function RootLayout() {
	const { theme, setTheme } = useTheme();

	return (
		<div className="bg-background text-foreground min-h-screen">
			<header className="border-border flex items-center justify-between border-b px-6 py-3">
				<h1 className="text-lg font-bold">Admin Dashboard</h1>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setTheme(themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length])}
					aria-label="Theme"
				>
					{themeIcons[theme]}
				</Button>
			</header>
			<Outlet />
		</div>
	);
}
