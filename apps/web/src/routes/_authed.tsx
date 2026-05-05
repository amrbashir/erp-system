import { ORPCError } from "@orpc/client";
import {
	Outlet,
	Link,
	createFileRoute,
	redirect,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

import { OrgSwitcher } from "@/components/org-switcher";
import { isDesktop } from "@/lib/activation";
import { clearToken } from "@/lib/api-fetch";
import { signOut } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

const CURRENT_ORG_KEY = "current_org_id";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ context, location }) => {
		const session = await context.queryClient.ensureQueryData(orpc.session.get.queryOptions());
		if (!session) {
			throw redirect({ to: "/login", search: { redirect: location.pathname } });
		}

		let orgs;
		try {
			orgs = await context.queryClient.ensureQueryData(orpc.orgs.list.queryOptions());
		} catch (e) {
			// UNAUTHORIZED = token expired/invalid → bounce to login. Other failures
			// bubble up rather than silently treat as zero-orgs (would misroute to
			// /onboarding).
			if (e instanceof ORPCError && e.code === "UNAUTHORIZED") {
				throw redirect({ to: "/login", search: { redirect: location.pathname } });
			}
			throw e;
		}

		// Desktop has no cookie; trust localStorage (with membership check)
		// then fall back to first org. Web reads the httpOnly cookie via
		// orgs.current.
		let currentOrgId: string | null;
		if (isDesktop()) {
			const stored =
				typeof localStorage !== "undefined" ? localStorage.getItem(CURRENT_ORG_KEY) : null;
			currentOrgId = (stored && orgs.find((o) => o.id === stored)?.id) ?? orgs[0]?.id ?? null;
		} else {
			currentOrgId = (
				await context.queryClient.ensureQueryData(orpc.orgs.current.queryOptions())
			).orgId;
		}

		if (orgs.length === 0 && location.pathname !== "/onboarding") {
			throw redirect({ to: "/onboarding" });
		}

		return { session, orgs, currentOrgId };
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { orgs, currentOrgId } = Route.useRouteContext();
	const desktop = isDesktop();

	const navValue = pathname.startsWith("/users")
		? "users"
		: pathname.startsWith("/dashboard")
			? "dashboard"
			: undefined;

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
					<Tabs value={navValue}>
						<TabsList variant="line">
							<TabsTrigger
								value="dashboard"
								render={<Link to="/dashboard" />}
								nativeButton={false}
							>
								{m.nav_dashboard()}
							</TabsTrigger>
							<TabsTrigger
								value="users"
								render={<Link to="/users" />}
								nativeButton={false}
							>
								{m.nav_users()}
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
				<Button variant="ghost" size="sm" onClick={handleLogout}>
					{m.nav_logout()}
				</Button>
			</div>
			<Outlet />
		</>
	);
}
