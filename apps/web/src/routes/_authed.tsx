import { ORPCError } from "@orpc/client";
import { Outlet, Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";

import { OrgSwitcher } from "@/components/org-switcher";
import { isDesktop } from "@/lib/activation";
import { clearToken } from "@/lib/api-fetch";
import { authClient, signOut } from "@/lib/auth-client";
import { getSession } from "@/lib/auth-session";
import { getCurrentOrgId } from "@/lib/org-fns";
import { client } from "@/lib/orpc";

const CURRENT_ORG_KEY = "current_org_id";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ location }) => {
		if (isDesktop()) {
			const sessionRes = await authClient.getSession();
			if (!sessionRes.data) {
				// __root will keep us on onboarding if no users; otherwise show login
				throw redirect({ to: "/login", search: { redirect: location.pathname } });
			}

			const orgs = await client.orgs.list().catch((e: Error) => e);
			// UNAUTHORIZED = token expired/invalid → bounce to login. Other
			// failures bubble up rather than silently treat as zero-orgs (which
			// would misroute to /onboarding).
			if (orgs instanceof ORPCError && orgs.code === "UNAUTHORIZED") {
				throw redirect({ to: "/login", search: { redirect: location.pathname } });
			}
			if (orgs instanceof Error) throw orgs;

			const stored =
				typeof localStorage !== "undefined" ? localStorage.getItem(CURRENT_ORG_KEY) : null;
			const currentOrgId =
				(stored && orgs.find((o) => o.id === stored)?.id) ?? orgs[0]?.id ?? null;

			if (orgs.length === 0 && location.pathname !== "/onboarding") {
				throw redirect({ to: "/onboarding" });
			}

			return { session: { user: sessionRes.data.user }, orgs, currentOrgId };
		}

		const session = await getSession();
		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.pathname },
			});
		}

		const orgs = await client.orgs.list();
		const currentOrgId = await getCurrentOrgId();

		if (orgs.length === 0 && location.pathname !== "/onboarding") {
			throw redirect({ to: "/onboarding" });
		}

		return { session, orgs, currentOrgId };
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	const navigate = useNavigate();
	const { orgs, currentOrgId } = Route.useRouteContext();
	const desktop = isDesktop();

	async function handleLogout() {
		await signOut();
		if (desktop) {
			clearToken();
			window.location.href = "/";
			return;
		}
		void navigate({ to: "/login" });
	}

	return (
		<>
			<div className="flex items-center justify-between border-b px-4 py-2">
				<div className="flex items-center gap-4">
					<OrgSwitcher orgs={orgs} currentOrgId={currentOrgId} />
					<nav className="flex gap-2 text-sm">
						<Link
							to="/dashboard"
							className="text-muted-foreground hover:text-foreground [&.active]:text-foreground"
						>
							{m.nav_dashboard()}
						</Link>
						<Link
							to="/users"
							className="text-muted-foreground hover:text-foreground [&.active]:text-foreground"
						>
							{m.nav_users()}
						</Link>
					</nav>
				</div>
				<Button variant="ghost" size="sm" onClick={handleLogout}>
					{m.nav_logout()}
				</Button>
			</div>
			<Outlet />
		</>
	);
}
