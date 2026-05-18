import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { LogoWordmark } from "@/components/logo";

export function AppLayout({
	children,
	leadingSlot = (
		<Link to="/" aria-label="Kaname ERP">
			<LogoWordmark className="h-7" />
		</Link>
	),
}: {
	children: ReactNode;
	leadingSlot?: ReactNode;
}) {
	return (
		<>
			<AppHeader leadingSlot={leadingSlot} />
			{children}
		</>
	);
}
