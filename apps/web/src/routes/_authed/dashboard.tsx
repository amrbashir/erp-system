import { createFileRoute } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authed/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { session, orgs, currentOrgId } = Route.useRouteContext();
	const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];

	// One-shot banner after signup if invitations were consumed (orgs > 0 means
	// the user joined at least one org without going through /onboarding).
	const [showJoined, setShowJoined] = useState(false);
	useEffect(() => {
		if (typeof sessionStorage === "undefined") return;
		if (sessionStorage.getItem("post_signup") === "1" && orgs.length > 0) {
			setShowJoined(true);
		}
		sessionStorage.removeItem("post_signup");
	}, [orgs.length]);

	return (
		<div className="flex min-h-svh flex-col p-6">
			{showJoined && (
				<div className="border-border bg-muted/40 mb-4 flex items-start justify-between gap-4 rounded border p-3 text-sm">
					<div>
						<p className="mb-1">{m.dashboard_joined_via_invite()}</p>
						<ul className="list-disc ps-5">
							{orgs.map((o) => (
								<li key={o.id}>
									<strong>{o.name}</strong>
								</li>
							))}
						</ul>
					</div>
					<Button variant="ghost" size="sm" onClick={() => setShowJoined(false)}>
						{m.dashboard_dismiss()}
					</Button>
				</div>
			)}
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
