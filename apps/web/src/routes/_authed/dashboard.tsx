import { createFileRoute } from "@tanstack/react-router";
import { m } from "@workspace/i18n";

export const Route = createFileRoute("/_authed/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { session, orgs, currentOrgId } = Route.useRouteContext();
	const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];

	return (
		<div className="flex min-h-svh flex-col p-6">
			<div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
				<h1 className="font-medium">{m.dashboard_welcome({ name: session.user.name })}</h1>
				{currentOrg && (
					<p>
						{m.dashboard_current_org()} <strong>{currentOrg.name}</strong>
					</p>
				)}
			</div>
		</div>
	);
}
