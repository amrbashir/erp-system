import { createFileRoute, redirect } from "@tanstack/react-router";
import { m } from "@workspace/i18n";

import { CreateOrgForm } from "@/components/create-org-form";

export const Route = createFileRoute("/_authed/_app/onboarding")({
	beforeLoad: async ({ context }) => {
		if (context.orgs.length > 0) {
			throw redirect({ to: "/home" });
		}
	},
	component: OnboardingPage,
});

function OnboardingPage() {
	return <CreateOrgForm title={m.onboarding_title()} description={m.onboarding_description()} />;
}
