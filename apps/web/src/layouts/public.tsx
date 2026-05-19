import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { LogoWordmark } from "@/components/logo";

export function PublicLayout({ children }: { children: ReactNode }) {
	return (
		<div className="bg-background text-foreground relative isolate flex min-h-svh flex-col">
			<GridBackdrop />

			<div className="sticky top-4 z-20 px-4 sm:top-6 sm:px-6">
				<div className="border-border/40 bg-background/60 mx-auto max-w-5xl rounded-2xl border shadow-lg shadow-black/20 backdrop-blur-md">
					<AppHeader
						borderless
						leadingSlot={
							<Link to="/" aria-label="Kaname ERP">
								<LogoWordmark className="h-7" />
							</Link>
						}
					/>
				</div>
			</div>

			{children}

			<footer className="text-muted-foreground px-6 py-6 text-xs sm:px-10">
				© {new Date().getFullYear()} Kaname ERP
			</footer>
		</div>
	);
}

function GridBackdrop() {
	const gridMask = "radial-gradient(closest-side at 50% 45%, black 55%, transparent 100%)";
	return (
		<>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 -z-20"
				style={{
					background: [
						"radial-gradient(120% 80% at 20% 10%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 60%)",
						"radial-gradient(80% 60% at 90% 90%, color-mix(in oklch, var(--primary) 6%, transparent), transparent 60%)",
					].join(", "),
				}}
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 -z-10"
				style={{
					backgroundImage: [
						"linear-gradient(color-mix(in oklch, var(--border) 55%, transparent) 1px, transparent 1px)",
						"linear-gradient(90deg, color-mix(in oklch, var(--border) 55%, transparent) 1px, transparent 1px)",
					].join(", "),
					backgroundSize: "44px 44px",
					maskImage: gridMask,
					WebkitMaskImage: gridMask,
				}}
			/>
		</>
	);
}
