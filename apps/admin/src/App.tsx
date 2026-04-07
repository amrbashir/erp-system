import { useEffect, useState } from "react";

interface Activation {
	id: string;
	hardwareId: string;
	status: "pending" | "active" | "revoked";
	activatedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export function App() {
	const [activations, setActivations] = useState<Activation[]>([]);
	const [loading, setLoading] = useState(true);
	const [toggling, setToggling] = useState<string | null>(null);

	async function fetchActivations() {
		const res = await fetch("/api/activations");
		if (res.ok) {
			setActivations(await res.json());
		}
		setLoading(false);
	}

	useEffect(() => {
		fetchActivations();
	}, []);

	async function toggle(id: string, newStatus: "active" | "revoked") {
		setToggling(id);
		const res = await fetch(`/api/activations/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: newStatus }),
		});
		if (res.ok) {
			await fetchActivations();
		}
		setToggling(null);
	}

	const statusColor: Record<string, string> = {
		active: "bg-green-100 text-green-800",
		pending: "bg-yellow-100 text-yellow-800",
		revoked: "bg-red-100 text-red-800",
	};

	return (
		<div className="bg-background text-foreground min-h-screen p-8">
			<h1 className="mb-6 text-2xl font-bold">Activation Dashboard</h1>

			{loading ? (
				<p className="text-muted-foreground">Loading...</p>
			) : activations.length === 0 ? (
				<p className="text-muted-foreground">No activations found.</p>
			) : (
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-border border-b text-left">
							<th className="px-4 py-3 font-medium">Hardware ID</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Activated At</th>
							<th className="px-4 py-3 font-medium">Created At</th>
							<th className="px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{activations.map((a) => (
							<tr key={a.id} className="border-border border-b">
								<td className="px-4 py-3 font-mono text-sm">{a.hardwareId}</td>
								<td className="px-4 py-3">
									<span
										className={`rounded px-2 py-1 text-xs font-medium ${statusColor[a.status] ?? ""}`}
									>
										{a.status}
									</span>
								</td>
								<td className="text-muted-foreground px-4 py-3 text-sm">
									{a.activatedAt
										? new Date(a.activatedAt).toLocaleDateString()
										: "-"}
								</td>
								<td className="text-muted-foreground px-4 py-3 text-sm">
									{new Date(a.createdAt).toLocaleDateString()}
								</td>
								<td className="px-4 py-3">
									{a.status === "active" ? (
										<button
											className="bg-destructive rounded px-3 py-1 text-sm text-white disabled:opacity-50"
											disabled={toggling === a.id}
											onClick={() => toggle(a.id, "revoked")}
										>
											Revoke
										</button>
									) : (
										<button
											className="bg-primary text-primary-foreground rounded px-3 py-1 text-sm disabled:opacity-50"
											disabled={toggling === a.id}
											onClick={() => toggle(a.id, "active")}
										>
											Activate
										</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
