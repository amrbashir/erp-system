import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useMemo, useState } from "react";

import { orpc } from "@/lib/orpc";

type Member = {
	kind: "member";
	id: string;
	userId: string;
	role: "owner" | "admin" | "member";
	userName: string;
	userEmail: string;
	createdAt: string | Date;
};

type Invitation = {
	kind: "invitation";
	id: string;
	email: string;
	role: "owner" | "admin" | "member";
	createdAt: string | Date;
};

type Row = Member | Invitation;

export const Route = createFileRoute("/_authed/users")({
	component: UsersPage,
});

function UsersPage() {
	const { orgs, currentOrgId } = Route.useRouteContext();
	const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];
	const actorRole = currentOrg?.role as "owner" | "admin" | "member";

	const { data, isLoading } = useQuery(orpc.members.list.queryOptions());
	const members = (data?.members ?? []) as Member[];
	const invitations = (data?.invitations ?? []) as Invitation[];

	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [pendingFirst, setPendingFirst] = useState(false);

	const canManage = actorRole === "owner" || actorRole === "admin";

	const rows: Row[] = useMemo(() => {
		const ms: Row[] = members;
		const is: Row[] = invitations;
		return pendingFirst ? [...is, ...ms] : [...ms, ...is];
	}, [members, invitations, pendingFirst]);

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
					onDone={() => setShowForm(false)}
					onError={setError}
				/>
			)}

			{isLoading ? (
				<p className="text-muted-foreground text-sm">{m.users_loading()}</p>
			) : (
				<MemberList
					rows={rows}
					actorRole={actorRole}
					pendingFirst={pendingFirst}
					onTogglePending={() => setPendingFirst((v) => !v)}
					onError={setError}
				/>
			)}
		</div>
	);
}

function AddUserForm({
	actorRole,
	onDone,
	onError,
}: {
	actorRole: "owner" | "admin";
	onDone: () => void;
	onError: (msg: string) => void;
}) {
	const queryClient = useQueryClient();
	const addMutation = useMutation(
		orpc.members.add.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: orpc.members.list.queryKey() });
			},
		}),
	);

	async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		onError("");

		const form = new FormData(e.currentTarget);
		const email = (form.get("email") as string).trim();
		const role = form.get("role") as "owner" | "admin" | "member";

		try {
			await addMutation.mutateAsync({ email, role });
			onDone();
		} catch (err: any) {
			onError(err?.message || m.users_add_failed());
		}
	}

	return (
		<form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
			<div className="flex gap-3">
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
				<Button type="submit" size="sm" disabled={addMutation.isPending}>
					{addMutation.isPending ? m.users_adding() : m.users_add_submit()}
				</Button>
			</div>
		</form>
	);
}

function MemberList({
	rows,
	actorRole,
	pendingFirst,
	onTogglePending,
	onError,
}: {
	rows: Row[];
	actorRole: "owner" | "admin" | "member";
	pendingFirst: boolean;
	onTogglePending: () => void;
	onError: (msg: string) => void;
}) {
	const canManage = actorRole === "owner" || actorRole === "admin";
	const queryClient = useQueryClient();
	const [pendingRoleChanges, setPendingRoleChanges] = useState<Set<string>>(() => new Set());
	const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(() => new Set());
	const [transferTarget, setTransferTarget] = useState<Member | null>(null);
	const [transferRole, setTransferRole] = useState<"admin" | "member">("admin");

	const invalidateMembers = () =>
		queryClient.invalidateQueries({ queryKey: orpc.members.list.queryKey() });

	const updateRoleMutation = useMutation(
		orpc.members.updateRole.mutationOptions({ onSuccess: invalidateMembers }),
	);
	const removeMutation = useMutation(
		orpc.members.remove.mutationOptions({ onSuccess: invalidateMembers }),
	);
	const revokeMutation = useMutation(
		orpc.invitations.revoke.mutationOptions({ onSuccess: invalidateMembers }),
	);
	const transferMutation = useMutation(
		orpc.members.transferOwnership.mutationOptions({ onSuccess: invalidateMembers }),
	);

	async function handleRoleChange(memberId: string, newRole: string) {
		onError("");
		setPendingRoleChanges((p) => new Set(p).add(memberId));
		try {
			await updateRoleMutation.mutateAsync({
				memberId,
				role: newRole as "owner" | "admin" | "member",
			});
		} catch (err: any) {
			onError(err?.message || m.users_role_update_failed());
		} finally {
			setPendingRoleChanges((p) => {
				const n = new Set(p);
				n.delete(memberId);
				return n;
			});
		}
	}

	async function handleRemove(memberId: string) {
		onError("");
		setPendingRemovals((p) => new Set(p).add(memberId));
		try {
			await removeMutation.mutateAsync({ memberId });
		} catch (err: any) {
			onError(err?.message || m.users_remove_failed());
		} finally {
			setPendingRemovals((p) => {
				const n = new Set(p);
				n.delete(memberId);
				return n;
			});
		}
	}

	async function handleRevokeInvitation(invitationId: string) {
		onError("");
		setPendingRemovals((p) => new Set(p).add(invitationId));
		try {
			await revokeMutation.mutateAsync({ invitationId });
		} catch (err: any) {
			onError(err?.message || m.users_remove_failed());
		} finally {
			setPendingRemovals((p) => {
				const n = new Set(p);
				n.delete(invitationId);
				return n;
			});
		}
	}

	async function handleTransfer() {
		if (!transferTarget) return;
		onError("");
		try {
			await transferMutation.mutateAsync({
				targetMemberId: transferTarget.id,
				newActorRole: transferRole,
			});
			setTransferTarget(null);
		} catch (err: any) {
			onError(err?.message || m.users_transfer_failed());
		}
	}

	if (rows.length === 0) {
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
						<Button size="sm" onClick={handleTransfer} disabled={transferMutation.isPending}>
							{transferMutation.isPending
								? m.users_transferring()
								: m.users_confirm_transfer()}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setTransferTarget(null)}
							disabled={transferMutation.isPending}
						>
							{m.cancel()}
						</Button>
					</div>
				</div>
			)}
			<table className="w-full text-sm">
				<thead>
					<tr className="border-border border-b text-start">
						<th className="py-2 font-medium">{m.label_name()}</th>
						<th className="py-2 font-medium">{m.label_email()}</th>
						<th className="py-2 font-medium">{m.label_role()}</th>
						<th className="py-2 font-medium">
							<button
								type="button"
								onClick={onTogglePending}
								className="hover:text-foreground text-muted-foreground"
								title={m.users_sort_pending()}
							>
								{m.users_status()} {pendingFirst ? "↑" : "↓"}
							</button>
						</th>
						{canManage && <th className="py-2 font-medium">{m.users_actions()}</th>}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) =>
						row.kind === "member" ? (
							<MemberRow
								key={`m-${row.id}`}
								member={row}
								actorRole={actorRole}
								canManage={canManage}
								roleSubmitting={pendingRoleChanges.has(row.id)}
								removeSubmitting={pendingRemovals.has(row.id)}
								onRoleChange={handleRoleChange}
								onRemove={handleRemove}
								onTransfer={() => setTransferTarget(row)}
							/>
						) : (
							<InvitationRow
								key={`i-${row.id}`}
								invitation={row}
								canManage={canManage}
								removeSubmitting={pendingRemovals.has(row.id)}
								onRevoke={handleRevokeInvitation}
							/>
						),
					)}
				</tbody>
			</table>
		</>
	);
}

function MemberRow({
	member,
	actorRole,
	canManage,
	roleSubmitting,
	removeSubmitting,
	onRoleChange,
	onRemove,
	onTransfer,
}: {
	member: Member;
	actorRole: "owner" | "admin" | "member";
	canManage: boolean;
	roleSubmitting: boolean;
	removeSubmitting: boolean;
	onRoleChange: (id: string, role: string) => void;
	onRemove: (id: string) => void;
	onTransfer: () => void;
}) {
	return (
		<tr className="border-border border-b">
			<td className="py-2">{member.userName}</td>
			<td className="py-2">{member.userEmail}</td>
			<td className="py-2">
				{canManage && (actorRole === "owner" || member.role === "member") ? (
					<select
						value={member.role}
						onChange={(e) => onRoleChange(member.id, e.target.value)}
						disabled={roleSubmitting}
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
			<td className="text-muted-foreground py-2 text-xs">{m.users_status_active()}</td>
			{canManage && (
				<td className="flex gap-1 py-2">
					{actorRole === "owner" && member.role !== "owner" && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onTransfer}
							className="h-7 text-xs"
						>
							{m.users_transfer()}
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onRemove(member.id)}
						disabled={removeSubmitting}
						className="text-destructive h-7 text-xs"
					>
						{removeSubmitting ? m.users_removing() : m.users_remove()}
					</Button>
				</td>
			)}
		</tr>
	);
}

function InvitationRow({
	invitation,
	canManage,
	removeSubmitting,
	onRevoke,
}: {
	invitation: Invitation;
	canManage: boolean;
	removeSubmitting: boolean;
	onRevoke: (id: string) => void;
}) {
	return (
		<tr className="border-border border-b opacity-70">
			<td className="text-muted-foreground py-2 italic">{m.users_status_pending()}</td>
			<td className="py-2">{invitation.email}</td>
			<td className="py-2">
				{
					{
						owner: m.role_owner(),
						admin: m.role_admin(),
						member: m.role_member(),
					}[invitation.role]
				}
			</td>
			<td className="py-2">
				<span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
					{m.users_status_pending()}
				</span>
			</td>
			{canManage && (
				<td className="flex gap-1 py-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onRevoke(invitation.id)}
						disabled={removeSubmitting}
						className="text-destructive h-7 text-xs"
					>
						{removeSubmitting ? m.users_removing() : m.users_revoke()}
					</Button>
				</td>
			)}
		</tr>
	);
}
