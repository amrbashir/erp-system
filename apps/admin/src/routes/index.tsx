import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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

import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(orpc.activations.list.queryOptions()),
	component: ActivationDashboard,
});

function ActivationDashboard() {
	const queryClient = useQueryClient();
	const { data: activations = [] } = useQuery(orpc.activations.list.queryOptions());
	const toggleMutation = useMutation(
		orpc.activations.toggleStatus.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({ queryKey: orpc.activations.list.queryKey() }),
		}),
	);

	const togglingId =
		toggleMutation.isPending && toggleMutation.variables
			? (toggleMutation.variables as { id: string }).id
			: null;

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
									<Badge variant={statusVariant[a.status]}>{a.status}</Badge>
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
											disabled={togglingId === a.id}
											onClick={() =>
												toggleMutation.mutate({ id: a.id, status: "revoked" })
											}
										>
											Revoke
										</Button>
									) : (
										<Button
											size="sm"
											disabled={togglingId === a.id}
											onClick={() =>
												toggleMutation.mutate({ id: a.id, status: "active" })
											}
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
