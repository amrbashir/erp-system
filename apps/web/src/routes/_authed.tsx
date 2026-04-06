import {
	Outlet,
	createFileRoute,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { getSession } from "../lib/auth-session";
import { getOrgs, getCurrentOrgId } from "../lib/org-fns";
import { signOut } from "../lib/auth-client";
import { OrgSwitcher } from "../components/org-switcher";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ location }) => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/login" });
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

	async function handleLogout() {
		await signOut();
		navigate({ to: "/login" });
	}

	return (
		<>
			<div className="flex items-center justify-between border-b px-4 py-2">
				<OrgSwitcher orgs={orgs} currentOrgId={currentOrgId} />
				<Button variant="ghost" size="sm" onClick={handleLogout}>
					Log out
				</Button>
			</div>
			<Outlet />
		</>
	);
}
