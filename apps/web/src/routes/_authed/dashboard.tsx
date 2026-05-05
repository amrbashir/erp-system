import { createFileRoute } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

export const Route = createFileRoute("/_authed/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { session, orgs, currentOrgId } = Route.useRouteContext();
	const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];

	return (
		<div className="p-6">
			<Card className="max-w-md">
				<CardHeader>
					<CardTitle>{m.dashboard_welcome({ name: session.user.name })}</CardTitle>
				</CardHeader>
				{currentOrg && (
					<CardContent>
						{m.dashboard_current_org()} <strong>{currentOrg.name}</strong>
					</CardContent>
				)}
			</Card>
		</div>
	);
}
