import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { signOut, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_authed/")({ component: App });

function App() {
	const navigate = useNavigate();
	const { data: session } = useSession();

	async function handleLogout() {
		await signOut();
		navigate({ to: "/login" });
	}

	return (
		<div className="flex min-h-svh p-6">
			<div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
				<div>
					<h1 className="font-medium">
						Welcome, {session?.user?.name ?? "User"}
					</h1>
					<p>{session?.user?.email}</p>
					<Button className="mt-2" onClick={handleLogout}>
						Log out
					</Button>
				</div>
			</div>
		</div>
	);
}
