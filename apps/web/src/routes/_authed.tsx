import { Outlet, Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";

import { OrgSwitcher } from "@/components/org-switcher";
import { isDesktop } from "@/lib/activation";
import { signOut } from "@/lib/auth-client";
import { getSession } from "@/lib/auth-session";
import { getDesktopSession, desktopLogout } from "@/lib/desktop-auth";
import { getOrgs, getCurrentOrgId } from "@/lib/org-fns";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ location }) => {
		if (isDesktop()) {
			const desktopSession = await getDesktopSession();
			if (!desktopSession) {
				// root layout will handle login
				throw redirect({ to: "/" });
			}

			const orgs = desktopSession.orgs;
			const currentOrgId = orgs[0]?.id ?? null;

			return {
				session: { user: desktopSession.user },
				orgs,
				currentOrgId,
			};
		}

		const session = await getSession();
		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.pathname },
			});
		}

		const orgs = await getOrgs();
		const currentOrgId = await getCurrentOrgId();

		// redirect to onboarding if no orgs (unless already there)
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
		if (desktop) {
			await desktopLogout();
			// force full reload to go back to login screen
			window.location.href = "/";
			return;
		}
		await signOut();
		navigate({ to: "/login" });
	}

	return (
		<>
			<div className="flex items-center justify-between border-b px-4 py-2">
				<div className="flex items-center gap-4">
					{!desktop && <OrgSwitcher orgs={orgs} currentOrgId={currentOrgId} />}
					{desktop && orgs[0] && (
						<span className="text-sm font-medium">{orgs[0].name}</span>
					)}
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
