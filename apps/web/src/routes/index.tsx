import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { LanguageSwitcher } from "@workspace/ui/components/language-switcher";
import { ThemeSwitcher } from "@workspace/ui/components/theme-switcher";

import { isDesktop } from "@/lib/activation";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(orpc.session.get.queryOptions());
		// Desktop is single-tenant - no marketing page makes sense; route through the auth gate.
		if (session || isDesktop()) throw redirect({ to: "/home" });
	},
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="bg-background text-foreground flex min-h-svh flex-col">
			<header className="flex items-center justify-between px-6 py-4">
				<BrandMark />
				<div className="flex items-center gap-1">
					<ThemeSwitcher />
					<LanguageSwitcher />
				</div>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
				<h1 className="max-w-3xl text-5xl font-bold tracking-tight text-balance sm:text-6xl md:text-7xl">
					{m.landing_hero_title()}
				</h1>
				<p className="text-muted-foreground mt-6 max-w-md text-base text-balance sm:text-lg">
					{m.landing_hero_subtitle()}
				</p>
				<div className="mt-10 flex items-center gap-2">
					<Button size="lg" render={<Link to="/login" />} nativeButton={false}>
						{m.signin_submit()}
					</Button>
					<Button
						variant="ghost"
						size="lg"
						render={<Link to="/signup" />}
						nativeButton={false}
					>
						{m.signup_submit()}
					</Button>
				</div>
			</main>
		</div>
	);
}

function BrandMark() {
	return (
		<Link to="/" className="flex items-center gap-2">
			<span className="bg-primary size-7 rounded-md" aria-hidden />
			<span className="text-base font-semibold">Kaname</span>
		</Link>
	);
}
