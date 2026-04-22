import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";

import { CreateOrgForm } from "@/components/create-org-form";

export const Route = createFileRoute("/_authed/new-org")({
	component: NewOrgPage,
});

function NewOrgPage() {
	const navigate = useNavigate();
	return (
		<CreateOrgForm title={m.new_org_title()} onCancel={() => navigate({ to: "/dashboard" })} />
	);
}
