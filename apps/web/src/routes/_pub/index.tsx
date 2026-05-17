import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { IS_DESKTOP } from "@workspace/desktop";
import { m } from "@workspace/i18n";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";

import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_pub/")({
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(orpc.session.get.queryOptions());
		// Desktop is single-tenant - no marketing page makes sense; route through the auth gate.
		if (session || IS_DESKTOP) throw redirect({ to: "/home" });
	},
	component: LandingPage,
});

function LandingPage() {
	return (
		<main className="flex flex-1 items-center px-6 pt-12 pb-16 sm:px-10 sm:pt-20">
			<div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
				<div className="max-w-xl">
					<h1 className="text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl xl:text-7xl">
						{m.landing_hero_title()}
					</h1>
					<p className="text-muted-foreground mt-6 max-w-md text-base text-balance sm:text-lg">
						{m.landing_hero_subtitle()}
					</p>
					<div className="mt-10 flex items-center gap-3">
						<Button size="lg" render={<Link to="/login" />} nativeButton={false}>
							{m.signin_submit()}
						</Button>
						<Button
							variant="outline"
							size="lg"
							render={<Link to="/signup" />}
							nativeButton={false}
						>
							{m.signup_submit()}
						</Button>
					</div>
				</div>

				<div
					className="relative mx-auto h-[360px] w-full max-w-[420px] lg:mx-0"
					aria-hidden
				>
					<DecorativeCards />
				</div>
			</div>
		</main>
	);
}

function DecorativeCards() {
	return (
		<>
			<CashFlowCard className="absolute top-0 left-0 -rotate-3" />
			<InvoiceCard className="absolute top-14 right-0 rotate-2" />
			<CustomerCard className="absolute bottom-0 left-4" />
		</>
	);
}

const floatingCardClass =
	"gap-0 border border-border/60 bg-card/70 p-5 shadow-2xl shadow-black/40 ring-0 backdrop-blur-sm";

function CashFlowCard({ className }: { className?: string }) {
	return (
		<Card className={cn(floatingCardClass, "w-[240px]", className)}>
			<div className="flex items-baseline justify-between text-xs">
				<span className="text-muted-foreground tracking-[0.18em] uppercase">Cash flow</span>
				<span className="text-primary font-medium">+24%</span>
			</div>
			<div className="mt-3 flex items-baseline gap-1.5 font-mono">
				<span className="text-muted-foreground text-xl">$</span>
				<span className="text-3xl font-semibold tracking-tight">48,210</span>
			</div>
			<svg
				viewBox="0 0 240 60"
				preserveAspectRatio="none"
				className="text-primary mt-3 h-10 w-full"
				fill="none"
			>
				<path
					d="M0,45 L34,40 L68,46 L102,32 L136,30 L170,18 L204,14 L240,8"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<p className="text-muted-foreground mt-1 text-xs">Last 30 days</p>
		</Card>
	);
}

function InvoiceCard({ className }: { className?: string }) {
	return (
		<Card className={cn(floatingCardClass, "w-[240px]", className)}>
			<div className="flex items-center justify-between text-xs">
				<span className="text-muted-foreground font-mono">INV-2026-0418</span>
				<Badge
					variant="outline"
					className="border-primary/30 bg-primary/10 text-primary text-[10px]"
				>
					<span className="bg-primary size-1.5 rounded-full" aria-hidden />
					Paid
				</Badge>
			</div>
			<div className="mt-3">
				<p className="text-sm font-semibold">North Roastery</p>
				<p className="text-muted-foreground mt-0.5 text-xs">Yirgacheffe Light 1kg × 6</p>
			</div>
			<Separator className="bg-border/60 mt-4" />
			<div className="mt-3 flex items-baseline justify-between">
				<span className="text-muted-foreground text-xs tracking-widest uppercase">
					Total
				</span>
				<span className="font-mono text-base font-semibold">
					<span className="text-muted-foreground me-1">$</span>432.00
				</span>
			</div>
		</Card>
	);
}

function CustomerCard({ className }: { className?: string }) {
	return (
		<Card
			className={cn(
				floatingCardClass,
				"flex w-[280px] flex-row items-center gap-3",
				className,
			)}
		>
			<Avatar size="lg" className="shrink-0">
				<AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold tracking-wide">
					CS
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold">Shape Studio</p>
				<p className="text-muted-foreground truncate text-xs">Dubai · Pro plan</p>
			</div>
			<div className="text-end">
				<p className="font-mono text-sm font-semibold">
					<span className="text-muted-foreground me-1">$</span>1,840
				</p>
				<p className="text-muted-foreground text-[10px] tracking-wider uppercase">
					Balance
				</p>
			</div>
		</Card>
	);
}
