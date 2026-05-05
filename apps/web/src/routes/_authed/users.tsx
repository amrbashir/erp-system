import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Empty, EmptyDescription, EmptyHeader } from "@workspace/ui/components/empty";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
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

			{error && (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

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
	const [role, setRole] = useState<"owner" | "admin" | "member">("member");
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

		try {
			await addMutation.mutateAsync({ email, role });
			onDone();
		} catch (err) {
			onError(err instanceof Error ? err.message : m.users_add_failed());
		}
	}

	return (
		<form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
			<FieldGroup>
				<div className="flex gap-3">
					<Field className="flex-1">
						<FieldLabel htmlFor="add-user-email">{m.label_email()}</FieldLabel>
						<Input
							id="add-user-email"
							name="email"
							type="email"
							placeholder={m.label_email()}
							required
						/>
					</Field>
					<Field className="w-40">
						<FieldLabel htmlFor="add-user-role">{m.label_role()}</FieldLabel>
						<Select
							value={role}
							onValueChange={(v) => v && setRole(v as "owner" | "admin" | "member")}
						>
							<SelectTrigger id="add-user-role" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="member">{m.role_member()}</SelectItem>
									{actorRole === "owner" && (
										<>
											<SelectItem value="admin">{m.role_admin()}</SelectItem>
											<SelectItem value="owner">{m.role_owner()}</SelectItem>
										</>
									)}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Field>
				</div>
			</FieldGroup>
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
		} catch (err) {
			onError(err instanceof Error ? err.message : m.users_role_update_failed());
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
		} catch (err) {
			onError(err instanceof Error ? err.message : m.users_remove_failed());
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
		} catch (err) {
			onError(err instanceof Error ? err.message : m.users_remove_failed());
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
		} catch (err) {
			onError(err instanceof Error ? err.message : m.users_transfer_failed());
		}
	}

	if (rows.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyDescription>{m.users_no_members()}</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<>
			{transferTarget && (
				<Alert className="mb-4">
					<AlertDescription>
						<p className="mb-3">
							{m.users_transfer_confirm({ name: transferTarget.userName })}
						</p>
						<div className="mb-3 w-40">
							<Select
								value={transferRole}
								onValueChange={(v) => v && setTransferRole(v as "admin" | "member")}
							>
								<SelectTrigger size="sm" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="admin">{m.role_admin()}</SelectItem>
										<SelectItem value="member">{m.role_member()}</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="flex gap-2">
							<Button
								size="sm"
								onClick={handleTransfer}
								disabled={transferMutation.isPending}
							>
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
					</AlertDescription>
				</Alert>
			)}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{m.label_name()}</TableHead>
						<TableHead>{m.label_email()}</TableHead>
						<TableHead>{m.label_role()}</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								size="sm"
								onClick={onTogglePending}
								title={m.users_sort_pending()}
							>
								{m.users_status()}
								{pendingFirst ? (
									<ArrowUpIcon data-icon="inline-end" />
								) : (
									<ArrowDownIcon data-icon="inline-end" />
								)}
							</Button>
						</TableHead>
						{canManage && <TableHead>{m.users_actions()}</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
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
				</TableBody>
			</Table>
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
		<TableRow>
			<TableCell>{member.userName}</TableCell>
			<TableCell>{member.userEmail}</TableCell>
			<TableCell>
				{canManage && (actorRole === "owner" || member.role === "member") ? (
					<Select
						value={member.role}
						onValueChange={(v) => v && onRoleChange(member.id, v)}
						disabled={roleSubmitting}
					>
						<SelectTrigger size="sm" className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="member">{m.role_member()}</SelectItem>
								{actorRole === "owner" && (
									<>
										<SelectItem value="admin">{m.role_admin()}</SelectItem>
										<SelectItem value="owner">{m.role_owner()}</SelectItem>
									</>
								)}
							</SelectGroup>
						</SelectContent>
					</Select>
				) : (
					{
						owner: m.role_owner(),
						admin: m.role_admin(),
						member: m.role_member(),
					}[member.role]
				)}
			</TableCell>
			<TableCell>
				<Badge variant="secondary">{m.users_status_active()}</Badge>
			</TableCell>
			{canManage && (
				<TableCell>
					<div className="flex gap-1">
						{actorRole === "owner" && member.role !== "owner" && (
							<Button variant="ghost" size="sm" onClick={onTransfer}>
								{m.users_transfer()}
							</Button>
						)}
						<Button
							variant="destructive"
							size="sm"
							onClick={() => onRemove(member.id)}
							disabled={removeSubmitting}
						>
							{removeSubmitting ? m.users_removing() : m.users_remove()}
						</Button>
					</div>
				</TableCell>
			)}
		</TableRow>
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
		<TableRow className="opacity-70">
			<TableCell className="text-muted-foreground italic">
				{m.users_status_pending()}
			</TableCell>
			<TableCell>{invitation.email}</TableCell>
			<TableCell>
				{
					{
						owner: m.role_owner(),
						admin: m.role_admin(),
						member: m.role_member(),
					}[invitation.role]
				}
			</TableCell>
			<TableCell>
				<Badge variant="outline">{m.users_status_pending()}</Badge>
			</TableCell>
			{canManage && (
				<TableCell>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => onRevoke(invitation.id)}
						disabled={removeSubmitting}
					>
						{removeSubmitting ? m.users_removing() : m.users_revoke()}
					</Button>
				</TableCell>
			)}
		</TableRow>
	);
}
