import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";

import { isDesktop } from "@/lib/activation";

export const Route = createFileRoute("/_authed/")({
	beforeLoad: ({ context }) => {
		// desktop is single-tenant - skip the one-card list and go straight in
		if (isDesktop() && context.orgs.length === 1) {
			throw redirect({
				to: "/org/$orgSlug",
				params: { orgSlug: context.orgs[0].slug },
			});
		}
	},
	component: OrgsListPage,
});

function OrgsListPage() {
	const { orgs } = Route.useRouteContext();
	const desktop = isDesktop();

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{m.orgs_list_heading()}</h1>
				{!desktop && (
					<Button render={<Link to="/new-org" />} size="sm">
						{m.orgs_list_create()}
					</Button>
				)}
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				{orgs.map((org) => (
					<Link
						key={org.id}
						to="/org/$orgSlug"
						params={{ orgSlug: org.slug }}
						className="block"
					>
						<Card className="hover:bg-accent transition-colors">
							<CardHeader>
								<CardTitle>{org.name}</CardTitle>
								<CardDescription>/{org.slug}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
