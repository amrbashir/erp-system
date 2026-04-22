import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CreateOrgForm } from "@/components/create-org-form";

export const Route = createFileRoute("/_authed/new-org")({
	component: NewOrgPage,
});

function NewOrgPage() {
	const navigate = useNavigate();
	return (
		<CreateOrgForm title="New organization" onCancel={() => navigate({ to: "/dashboard" })} />
	);
}
