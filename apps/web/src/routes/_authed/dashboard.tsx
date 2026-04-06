import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { session } = Route.useRouteContext();
	return (
		<div className="flex min-h-svh p-6">
			<div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
				<h1 className="font-medium">
					Welcome, {session.user.name}
				</h1>
				<p>You are logged in.</p>
			</div>
		</div>
	);
}
