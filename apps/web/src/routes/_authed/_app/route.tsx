import { createFileRoute } from "@tanstack/react-router";

import { AppLayoutOutlet } from "@/components/app-layout";

export const Route = createFileRoute("/_authed/_app")({
	component: AppLayoutOutlet,
});
