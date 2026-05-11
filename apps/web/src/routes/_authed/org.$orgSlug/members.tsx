import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { memberAddBody } from "@workspace/server/members/members.contract";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Empty, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { useMemo, useState } from "react";
import type * as z from "zod";

import { orpc } from "@/lib/orpc";

type Role = "owner" | "admin" | "member";

type Member = {
	kind: "member";
	id: string;
	userId: string;
	role: Role;
	userName: string;
	userEmail: string;
	createdAt: string | Date;
};

type Invitation = {
	kind: "invitation";
	id: string;
	email: string;
	role: Role;
	createdAt: string | Date;
};

type Row = Member | Invitation;

export const Route = createFileRoute("/_authed/org/$orgSlug/members")({
	component: MembersPage,
});

function MembersPage() {
	const { orgSlug } = Route.useParams();
	const { session } = Route.useRouteContext();

	const { data, isLoading } = useQuery(orpc.members.list.queryOptions({ input: { orgSlug } }));
	const members = data?.members ?? [];
	const invitations = data?.invitations ?? [];

	// Defaults to "member" while loading so manage actions stay hidden until role is known.
	const actorRole = members.find((m) => m.userId === session.user.id)?.role ?? "member";

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
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-medium">{m.members_heading()}</h1>
				{canManage && (
					<Button size="sm" onClick={() => setShowForm(!showForm)}>
						{showForm ? m.cancel() : m.members_add()}
					</Button>
				)}
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{showForm && canManage && (
				<AddMemberForm
					orgSlug={orgSlug}
					actorRole={actorRole}
					onDone={() => setShowForm(false)}
					onError={setError}
				/>
			)}

			{isLoading ? (
				<MemberListSkeleton canManage={canManage} />
			) : (
				<MemberList
					orgSlug={orgSlug}
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

function AddMemberForm({
	orgSlug,
	actorRole,
	onDone,
	onError,
}: {
	orgSlug: string;
	actorRole: "owner" | "admin";
	onDone: () => void;
	onError: (msg: string) => void;
}) {
	const queryClient = useQueryClient();
	const addMutation = useMutation(
		orpc.members.add.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: orpc.members.list.queryKey({ input: { orgSlug } }),
				});
			},
		}),
	);

	const defaultValues: z.infer<typeof memberAddBody> = { email: "", role: "member" };
	const form = useForm({
		defaultValues,
		validators: { onSubmit: memberAddBody },
		onSubmit: async ({ value }) => {
			onError("");
			try {
				await addMutation.mutateAsync({ orgSlug, ...value });
				onDone();
			} catch (err) {
				onError(err instanceof Error ? err.message : m.members_add_failed());
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
			className="flex flex-col gap-3"
		>
			<FieldGroup>
				<div className="flex gap-3">
					<form.Field name="email">
						{(field) => (
							<Field className="flex-1">
								<FieldLabel htmlFor={field.name}>{m.label_email()}</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									placeholder={m.label_email()}
									required
									value={field.state.value}
									onChange={(e) => field.handleChange(e.currentTarget.value)}
									onBlur={field.handleBlur}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
					<form.Field name="role">
						{(field) => (
							<Field className="w-40">
								<FieldLabel htmlFor={field.name}>{m.label_role()}</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={(v) => {
										if (v === "owner" || v === "admin" || v === "member")
											field.handleChange(v);
									}}
								>
									<SelectTrigger id={field.name} className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="member">{m.role_member()}</SelectItem>
											{actorRole === "owner" && (
												<>
													<SelectItem value="admin">
														{m.role_admin()}
													</SelectItem>
													<SelectItem value="owner">
														{m.role_owner()}
													</SelectItem>
												</>
											)}
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
						)}
					</form.Field>
				</div>
			</FieldGroup>
			<div>
				<form.Subscribe selector={(s) => s.isSubmitting}>
					{(isSubmitting) => (
						<Button type="submit" size="sm" disabled={isSubmitting}>
							{isSubmitting ? m.members_adding() : m.members_add_submit()}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}

function MemberListSkeleton({ canManage }: { canManage: boolean }) {
	const cols = canManage ? 5 : 4;
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>{m.label_name()}</TableHead>
					<TableHead>{m.label_email()}</TableHead>
					<TableHead>{m.label_role()}</TableHead>
					<TableHead>{m.members_status()}</TableHead>
					{canManage && <TableHead>{m.members_actions()}</TableHead>}
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: 3 }).map((_, i) => (
					<TableRow key={i}>
						{Array.from({ length: cols }).map((_, j) => (
							<TableCell key={j}>
								<Skeleton className="h-4 w-full" />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function MemberList({
	orgSlug,
	rows,
	actorRole,
	pendingFirst,
	onTogglePending,
	onError,
}: {
	orgSlug: string;
	rows: Row[];
	actorRole: Role;
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
		queryClient.invalidateQueries({
			queryKey: orpc.members.list.queryKey({ input: { orgSlug } }),
		});

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

	async function handleRoleChange(memberId: string, newRole: Role) {
		onError("");
		setPendingRoleChanges((p) => new Set(p).add(memberId));
		try {
			await updateRoleMutation.mutateAsync({ orgSlug, memberId, role: newRole });
		} catch (err) {
			onError(err instanceof Error ? err.message : m.members_role_update_failed());
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
			await removeMutation.mutateAsync({ orgSlug, memberId });
		} catch (err) {
			onError(err instanceof Error ? err.message : m.members_remove_failed());
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
			await revokeMutation.mutateAsync({ orgSlug, invitationId });
		} catch (err) {
			onError(err instanceof Error ? err.message : m.members_remove_failed());
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
				orgSlug,
				targetMemberId: transferTarget.id,
				newActorRole: transferRole,
			});
			setTransferTarget(null);
		} catch (err) {
			onError(err instanceof Error ? err.message : m.members_transfer_failed());
		}
	}

	if (rows.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>{m.members_empty()}</EmptyTitle>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<>
			<AlertDialog
				open={!!transferTarget}
				onOpenChange={(open) => {
					if (!open && !transferMutation.isPending) setTransferTarget(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{m.members_transfer()}</AlertDialogTitle>
						<AlertDialogDescription>
							{transferTarget &&
								m.members_transfer_confirm({ name: transferTarget.userName })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="transfer-role">{m.label_role()}</FieldLabel>
							<Select
								value={transferRole}
								onValueChange={(v) => {
									if (v === "admin" || v === "member") setTransferRole(v);
								}}
							>
								<SelectTrigger id="transfer-role" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="admin">{m.role_admin()}</SelectItem>
										<SelectItem value="member">{m.role_member()}</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>
					</FieldGroup>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={transferMutation.isPending}>
							{m.cancel()}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleTransfer}
							disabled={transferMutation.isPending}
						>
							{transferMutation.isPending
								? m.members_transferring()
								: m.members_confirm_transfer()}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
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
								title={m.members_sort_pending()}
							>
								{m.members_status()}
								{pendingFirst ? (
									<ArrowUpIcon data-icon="inline-end" />
								) : (
									<ArrowDownIcon data-icon="inline-end" />
								)}
							</Button>
						</TableHead>
						{canManage && <TableHead>{m.members_actions()}</TableHead>}
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
	actorRole: Role;
	canManage: boolean;
	roleSubmitting: boolean;
	removeSubmitting: boolean;
	onRoleChange: (id: string, role: Role) => void;
	onRemove: (id: string) => void;
	onTransfer: () => void;
}) {
	return (
		<TableRow>
			<TableCell>{member.userName}</TableCell>
			<TableCell>{member.userEmail}</TableCell>
			<TableCell>
				{canManage && actorRole === "owner" ? (
					<Select
						value={member.role}
						onValueChange={(v) => {
							if (v === "owner" || v === "admin" || v === "member")
								onRoleChange(member.id, v);
						}}
						disabled={roleSubmitting}
					>
						<SelectTrigger size="sm" className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="member">{m.role_member()}</SelectItem>
								<SelectItem value="admin">{m.role_admin()}</SelectItem>
								<SelectItem value="owner">{m.role_owner()}</SelectItem>
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
				<Badge variant="secondary">{m.members_status_active()}</Badge>
			</TableCell>
			{canManage && (
				<TableCell>
					<div className="flex gap-1">
						{actorRole === "owner" && member.role !== "owner" && (
							<Button variant="ghost" size="sm" onClick={onTransfer}>
								{m.members_transfer()}
							</Button>
						)}
						<Button
							variant="destructive"
							size="sm"
							onClick={() => onRemove(member.id)}
							disabled={removeSubmitting}
						>
							{removeSubmitting ? m.members_removing() : m.members_remove()}
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
			<TableCell className="text-muted-foreground">-</TableCell>
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
				<Badge variant="outline">{m.members_status_pending()}</Badge>
			</TableCell>
			{canManage && (
				<TableCell>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => onRevoke(invitation.id)}
						disabled={removeSubmitting}
					>
						{removeSubmitting ? m.members_removing() : m.members_revoke()}
					</Button>
				</TableCell>
			)}
		</TableRow>
	);
}
