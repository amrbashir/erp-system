import { Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { getSession } from "../lib/auth-session";
import { signOut } from "../lib/auth-client";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	const navigate = useNavigate();

	async function handleLogout() {
		await signOut();
		navigate({ to: "/login" });
	}

	return (
		<>
			<div className="flex justify-end border-b px-4 py-2">
				<Button variant="ghost" size="sm" onClick={handleLogout}>
					Log out
				</Button>
			</div>
			<Outlet />
		</>
	);
}
