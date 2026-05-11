import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppHeader } from "./app-header";

export function AppLayout({
	children,
	leadingSlot = <BrandMark />,
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

export function AppLayoutOutlet() {
	return (
		<AppLayout>
			<Outlet />
		</AppLayout>
	);
}

function BrandMark() {
	return (
		<Link to="/" className="flex items-center gap-2">
			<span className="bg-primary size-7 rounded-md" aria-hidden />
			<span className="text-base font-semibold">Kaname</span>
		</Link>
	);
}
