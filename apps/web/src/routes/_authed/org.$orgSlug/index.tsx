import { createFileRoute } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

export const Route = createFileRoute("/_authed/org/$orgSlug/")({
	component: OrgHome,
});

function OrgHome() {
	const { org } = Route.useRouteContext();
	const { session } = Route.useRouteContext();

	return (
		<div className="p-6">
			<Card className="max-w-md">
				<CardHeader>
					<CardTitle>{m.org_home_welcome({ orgName: org.name })}</CardTitle>
				</CardHeader>
				<CardContent>{m.org_home_welcome_user({ name: session.user.name })}</CardContent>
			</Card>
		</div>
	);
}
