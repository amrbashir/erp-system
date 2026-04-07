import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { useState, useEffect, useCallback } from "react";

import { isDesktop } from "../../lib/activation";
import {
	getDesktopMembers,
	addDesktopMember,
	updateDesktopMemberRole,
	removeDesktopMember,
} from "../../lib/desktop-auth";

type Member = {
	id: string;
	userId: string;
	role: "owner" | "admin" | "member";
	userName: string;
	username?: string | null;
	userEmail?: string | null;
};

export const Route = createFileRoute("/_authed/users")({
	component: UsersPage,
});

function UsersPage() {
	const { orgs, currentOrgId } = Route.useRouteContext();
	const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];
	const actorRole = currentOrg?.role as "owner" | "admin" | "member";
	const desktop = isDesktop();

	const [members, setMembers] = useState<Member[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);

	const fetchMembers = useCallback(async () => {
		if (desktop && currentOrg) {
			const data = await getDesktopMembers(currentOrg.id);
			setMembers(data);
		} else {
			const res = await fetch("/api/orgs/members");
			if (res.ok) {
				setMembers(await res.json());
			}
		}
		setLoading(false);
	}, [desktop, currentOrg]);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	const canManage = actorRole === "owner" || actorRole === "admin";

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-lg font-medium">Users</h1>
				{canManage && (
					<Button size="sm" onClick={() => setShowForm(!showForm)}>
						{showForm ? "Cancel" : "Add user"}
					</Button>
				)}
			</div>

			{error && <p className="text-destructive mb-4 text-sm">{error}</p>}

			{showForm && canManage && (
				<AddUserForm
					actorRole={actorRole}
					desktop={desktop}
					orgId={currentOrg?.id}
					onDone={() => {
						setShowForm(false);
						fetchMembers();
					}}
					onError={setError}
				/>
			)}

			{loading ? (
				<p className="text-muted-foreground text-sm">Loading…</p>
			) : (
				<MemberList
					members={members}
					actorRole={actorRole}
					desktop={desktop}
					orgId={currentOrg?.id}
					onUpdate={fetchMembers}
					onError={setError}
				/>
			)}
		</div>
	);
}

function AddUserForm({
	actorRole,
	desktop,
	orgId,
	onDone,
	onError,
}: {
	actorRole: "owner" | "admin";
	desktop: boolean;
	orgId?: string;
	onDone: () => void;
	onError: (msg: string) => void;
}) {
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		onError("");
		setSubmitting(true);

		const form = new FormData(e.currentTarget);
		const name = (form.get("name") as string).trim();
		const role = form.get("role") as string;

		if (desktop && orgId) {
			const username = (form.get("username") as string).trim();
			const password = form.get("password") as string;

			try {
				await addDesktopMember(orgId, { username, password, name, role });
				onDone();
			} catch (err: any) {
				onError(err.message ?? "Failed to add user");
			} finally {
				setSubmitting(false);
			}
			return;
		}

		// web flow
		const email = (form.get("email") as string).trim();

		const res = await fetch("/api/orgs/members", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, role }),
		});

		setSubmitting(false);

		if (!res.ok) {
			const data = await res.json().catch(() => null);
			onError(data?.message ?? "Failed to add user");
			return;
		}

		onDone();
	}

	return (
		<form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
			<div className="flex gap-3">
				<input
					name="name"
					type="text"
					placeholder="Name"
					required
					className="border-border bg-background h-9 flex-1 rounded-none border px-3 text-sm"
				/>
				{desktop ? (
					<>
						<input
							name="username"
							type="text"
							placeholder="Username"
							required
							className="border-border bg-background h-9 flex-1 rounded-none border px-3 text-sm"
						/>
						<input
							name="password"
							type="password"
							placeholder="Password"
							required
							minLength={8}
							className="border-border bg-background h-9 flex-1 rounded-none border px-3 text-sm"
						/>
					</>
				) : (
					<input
						name="email"
						type="email"
						placeholder="Email"
						required
						className="border-border bg-background h-9 flex-1 rounded-none border px-3 text-sm"
					/>
				)}
				<select
					name="role"
					defaultValue="member"
					className="border-border bg-background h-9 rounded-none border px-3 text-sm"
				>
					<option value="member">Member</option>
					{actorRole === "owner" && (
						<>
							<option value="admin">Admin</option>
							<option value="owner">Owner</option>
						</>
					)}
				</select>
			</div>
			<div>
				<Button type="submit" size="sm" disabled={submitting}>
					{submitting ? "Adding…" : "Add"}
				</Button>
			</div>
		</form>
	);
}

function MemberList({
	members,
	actorRole,
	desktop,
	orgId,
	onUpdate,
	onError,
}: {
	members: Member[];
	actorRole: "owner" | "admin" | "member";
	desktop: boolean;
	orgId?: string;
	onUpdate: () => void;
	onError: (msg: string) => void;
}) {
	const canManage = actorRole === "owner" || actorRole === "admin";

	async function handleRoleChange(memberId: string, newRole: string) {
		onError("");
		if (desktop && orgId) {
			try {
				await updateDesktopMemberRole(orgId, memberId, newRole);
				onUpdate();
			} catch (err: any) {
				onError(err.message ?? "Failed to update role");
			}
			return;
		}

		const res = await fetch(`/api/orgs/members/${memberId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ role: newRole }),
		});
		if (!res.ok) {
			const data = await res.json().catch(() => null);
			onError(data?.message ?? "Failed to update role");
			return;
		}
		onUpdate();
	}

	async function handleRemove(memberId: string) {
		onError("");
		if (desktop && orgId) {
			try {
				await removeDesktopMember(orgId, memberId);
				onUpdate();
			} catch (err: any) {
				onError(err.message ?? "Failed to remove user");
			}
			return;
		}

		const res = await fetch(`/api/orgs/members/${memberId}`, {
			method: "DELETE",
		});
		if (!res.ok) {
			const data = await res.json().catch(() => null);
			onError(data?.message ?? "Failed to remove user");
			return;
		}
		onUpdate();
	}

	if (members.length === 0) {
		return <p className="text-muted-foreground text-sm">No members found.</p>;
	}

	return (
		<table className="w-full text-sm">
			<thead>
				<tr className="border-border border-b text-left">
					<th className="py-2 font-medium">Name</th>
					<th className="py-2 font-medium">{desktop ? "Username" : "Email"}</th>
					<th className="py-2 font-medium">Role</th>
					{canManage && <th className="py-2 font-medium">Actions</th>}
				</tr>
			</thead>
			<tbody>
				{members.map((m) => (
					<tr key={m.id} className="border-border border-b">
						<td className="py-2">{m.userName}</td>
						<td className="py-2">
							{desktop ? (m.username ?? "—") : (m.userEmail ?? "—")}
						</td>
						<td className="py-2">
							{canManage && (actorRole === "owner" || m.role === "member") ? (
								<select
									value={m.role}
									onChange={(e) => handleRoleChange(m.id, e.target.value)}
									className="border-border bg-background h-7 rounded-none border px-2 text-sm"
								>
									<option value="member">Member</option>
									{actorRole === "owner" && (
										<>
											<option value="admin">Admin</option>
											<option value="owner">Owner</option>
										</>
									)}
								</select>
							) : (
								m.role
							)}
						</td>
						{canManage && (
							<td className="py-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleRemove(m.id)}
									className="text-destructive h-7 text-xs"
								>
									Remove
								</Button>
							</td>
						)}
					</tr>
				))}
			</tbody>
		</table>
	);
}
