import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { IS_DESKTOP } from "@workspace/desktop";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";

import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_pub/")({
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(orpc.session.get.queryOptions());
		// Desktop is single-tenant - no marketing page makes sense; route through the auth gate.
		if (session || IS_DESKTOP) throw redirect({ to: "/home" });
	},
	component: LandingPage,
});

function LandingPage() {
	return (
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
	);
}
