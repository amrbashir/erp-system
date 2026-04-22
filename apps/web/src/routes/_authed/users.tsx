import { createFileRoute } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useState, useEffect, useCallback } from "react";

import { isDesktop } from "@/lib/activation";
import {
	getDesktopMembers,
	addDesktopMember,
	updateDesktopMemberRole,
	removeDesktopMember,
	transferDesktopOwnership,
} from "@/lib/desktop-auth";

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
				<h1 className="text-lg font-medium">{m.users_heading()}</h1>
				{canManage && (
					<Button size="sm" onClick={() => setShowForm(!showForm)}>
						{showForm ? m.cancel() : m.users_add()}
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
				<p className="text-muted-foreground text-sm">{m.users_loading()}</p>
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
				onError(err.message ?? m.users_add_failed());
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
			onError(data?.message ?? m.users_add_failed());
			return;
		}

		onDone();
	}

	return (
		<form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
			<div className="flex gap-3">
				<div className="flex flex-1 flex-col gap-1">
					<label htmlFor="add-user-name" className="text-sm font-medium">
						{m.label_name()}
					</label>
					<input
						id="add-user-name"
						name="name"
						type="text"
						placeholder={m.label_name()}
						required
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
				</div>
				{desktop ? (
					<>
						<div className="flex flex-1 flex-col gap-1">
							<label htmlFor="add-user-username" className="text-sm font-medium">
								{m.label_username()}
							</label>
							<input
								id="add-user-username"
								name="username"
								type="text"
								placeholder={m.label_username()}
								required
								className="border-border bg-background h-9 rounded-none border px-3 text-sm"
							/>
						</div>
						<div className="flex flex-1 flex-col gap-1">
							<label htmlFor="add-user-password" className="text-sm font-medium">
								{m.label_password()}
							</label>
							<input
								id="add-user-password"
								name="password"
								type="password"
								placeholder={m.label_password()}
								required
								minLength={8}
								className="border-border bg-background h-9 rounded-none border px-3 text-sm"
							/>
						</div>
					</>
				) : (
					<div className="flex flex-1 flex-col gap-1">
						<label htmlFor="add-user-email" className="text-sm font-medium">
							{m.label_email()}
						</label>
						<input
							id="add-user-email"
							name="email"
							type="email"
							placeholder={m.label_email()}
							required
							className="border-border bg-background h-9 rounded-none border px-3 text-sm"
						/>
					</div>
				)}
				<div className="flex flex-col gap-1">
					<label htmlFor="add-user-role" className="text-sm font-medium">
						{m.label_role()}
					</label>
					<select
						id="add-user-role"
						name="role"
						defaultValue="member"
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					>
						<option value="member">{m.role_member()}</option>
						{actorRole === "owner" && (
							<>
								<option value="admin">{m.role_admin()}</option>
								<option value="owner">{m.role_owner()}</option>
							</>
						)}
					</select>
				</div>
			</div>
			<div>
				<Button type="submit" size="sm" disabled={submitting}>
					{submitting ? m.users_adding() : m.users_add_submit()}
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
	const [pendingRoleChanges, setPendingRoleChanges] = useState<Set<string>>(() => new Set());
	const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(() => new Set());
	const [transferTarget, setTransferTarget] = useState<Member | null>(null);
	const [transferRole, setTransferRole] = useState<"admin" | "member">("admin");
	const [transferring, setTransferring] = useState(false);

	async function handleRoleChange(memberId: string, newRole: string) {
		onError("");
		setPendingRoleChanges((prev) => new Set(prev).add(memberId));
		try {
			if (desktop && orgId) {
				await updateDesktopMemberRole(orgId, memberId, newRole);
			} else {
				const res = await fetch(`/api/orgs/members/${memberId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ role: newRole }),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					onError(data?.message ?? m.users_role_update_failed());
					return;
				}
			}
			onUpdate();
		} catch (err: any) {
			onError(err.message ?? m.users_role_update_failed());
		} finally {
			setPendingRoleChanges((prev) => {
				const next = new Set(prev);
				next.delete(memberId);
				return next;
			});
		}
	}

	async function handleRemove(memberId: string) {
		onError("");
		setPendingRemovals((prev) => new Set(prev).add(memberId));
		try {
			if (desktop && orgId) {
				await removeDesktopMember(orgId, memberId);
			} else {
				const res = await fetch(`/api/orgs/members/${memberId}`, {
					method: "DELETE",
				});
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					onError(data?.message ?? m.users_remove_failed());
					return;
				}
			}
			onUpdate();
		} catch (err: any) {
			onError(err.message ?? m.users_remove_failed());
		} finally {
			setPendingRemovals((prev) => {
				const next = new Set(prev);
				next.delete(memberId);
				return next;
			});
		}
	}

	async function handleTransfer() {
		if (!transferTarget) return;
		onError("");
		setTransferring(true);
		try {
			if (desktop && orgId) {
				await transferDesktopOwnership(orgId, transferTarget.id, transferRole);
			} else {
				const res = await fetch("/api/orgs/members/transfer", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						targetMemberId: transferTarget.id,
						newActorRole: transferRole,
					}),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					onError(data?.message ?? m.users_transfer_failed());
					return;
				}
			}
			setTransferTarget(null);
			onUpdate();
		} catch (err: any) {
			onError(err.message ?? m.users_transfer_failed());
		} finally {
			setTransferring(false);
		}
	}

	if (members.length === 0) {
		return <p className="text-muted-foreground text-sm">{m.users_no_members()}</p>;
	}

	return (
		<>
			{transferTarget && (
				<div className="bg-background border-border mb-4 rounded border p-4">
					<p className="mb-3 text-sm">
						{m.users_transfer_confirm({ name: transferTarget.userName })}
					</p>
					<div className="mb-3 flex gap-3">
						<select
							value={transferRole}
							onChange={(e) => setTransferRole(e.target.value as "admin" | "member")}
							className="border-border bg-background h-8 rounded-none border px-2 text-sm"
						>
							<option value="admin">{m.role_admin()}</option>
							<option value="member">{m.role_member()}</option>
						</select>
					</div>
					<div className="flex gap-2">
						<Button size="sm" onClick={handleTransfer} disabled={transferring}>
							{transferring ? m.users_transferring() : m.users_confirm_transfer()}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setTransferTarget(null)}
							disabled={transferring}
						>
							{m.cancel()}
						</Button>
					</div>
				</div>
			)}
			<table className="w-full text-sm">
				<thead>
					<tr className="border-border border-b text-left">
						<th className="py-2 font-medium">{m.label_name()}</th>
						<th className="py-2 font-medium">
							{desktop ? m.label_username() : m.label_email()}
						</th>
						<th className="py-2 font-medium">{m.label_role()}</th>
						{canManage && <th className="py-2 font-medium">{m.users_actions()}</th>}
					</tr>
				</thead>
				<tbody>
					{members.map((member) => (
						<tr key={member.id} className="border-border border-b">
							<td className="py-2">{member.userName}</td>
							<td className="py-2">
								{desktop ? (member.username ?? "—") : (member.userEmail ?? "—")}
							</td>
							<td className="py-2">
								{canManage &&
								(actorRole === "owner" || member.role === "member") ? (
									<select
										value={member.role}
										onChange={(e) =>
											handleRoleChange(member.id, e.target.value)
										}
										disabled={pendingRoleChanges.has(member.id)}
										className="border-border bg-background h-7 rounded-none border px-2 text-sm disabled:opacity-50"
									>
										<option value="member">{m.role_member()}</option>
										{actorRole === "owner" && (
											<>
												<option value="admin">{m.role_admin()}</option>
												<option value="owner">{m.role_owner()}</option>
											</>
										)}
									</select>
								) : (
									{
										owner: m.role_owner(),
										admin: m.role_admin(),
										member: m.role_member(),
									}[member.role]
								)}
							</td>
							{canManage && (
								<td className="flex gap-1 py-2">
									{actorRole === "owner" && member.role !== "owner" && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setTransferTarget(member)}
											className="h-7 text-xs"
										>
											{m.users_transfer()}
										</Button>
									)}
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRemove(member.id)}
										disabled={pendingRemovals.has(member.id)}
										className="text-destructive h-7 text-xs"
									>
										{pendingRemovals.has(member.id)
											? m.users_removing()
											: m.users_remove()}
									</Button>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
}
