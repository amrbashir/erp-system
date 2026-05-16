import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";

import { PublicLayout } from "@/layouts/public";

export const Route = createFileRoute("/_pub")({
	component: PubLayout,
});

function PubLayout() {
	return (
		<PublicLayout headerTrailingSlot={<AuthSwitchActions />}>
			<Outlet />
		</PublicLayout>
	);
}

function AuthSwitchActions() {
	const { pathname } = useLocation();
	const showSignIn = !pathname.endsWith("/login");
	const showSignUp = !pathname.endsWith("/signup");
	return (
		<>
			{showSignUp && (
				<Button variant="ghost" render={<Link to="/signup" />} nativeButton={false}>
					{m.signup_submit()}
				</Button>
			)}
			{showSignIn && (
				<Button render={<Link to="/login" />} nativeButton={false}>
					{m.signin_submit()}
				</Button>
			)}
		</>
	);
}
