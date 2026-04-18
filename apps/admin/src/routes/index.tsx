import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { getActivations, toggleActivation } from "@/lib/activation-fns";

export const Route = createFileRoute("/")({
	loader: () => getActivations(),
	component: ActivationDashboard,
});

function ActivationDashboard() {
	const activations = Route.useLoaderData();
	const [toggling, setToggling] = useState<string | null>(null);
	const router = useRouter();

	async function toggle(id: string, newStatus: "active" | "revoked") {
		setToggling(id);
		await toggleActivation({ data: { id, status: newStatus } });
		await router.invalidate();
		setToggling(null);
	}

	const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
		active: "default",
		pending: "outline",
		revoked: "destructive",
	};

	return (
		<div className="p-8">
			<h2 className="mb-6 text-2xl font-bold">Activations</h2>

			{activations.length === 0 ? (
				<p className="text-muted-foreground">No activations found.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Hardware ID</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Activated At</TableHead>
							<TableHead>Created At</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{activations.map((a) => (
							<TableRow key={a.id}>
								<TableCell className="font-mono">{a.hardwareId}</TableCell>
								<TableCell>
									<Badge variant={statusVariant[a.status]}>
										{a.status}
									</Badge>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{a.activatedAt
										? new Date(a.activatedAt).toLocaleDateString()
										: "-"}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{new Date(a.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
									{a.status === "active" ? (
										<Button
											variant="destructive"
											size="sm"
											disabled={toggling === a.id}
											onClick={() => toggle(a.id, "revoked")}
										>
											Revoke
										</Button>
									) : (
										<Button
											size="sm"
											disabled={toggling === a.id}
											onClick={() => toggle(a.id, "active")}
										>
											Activate
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
