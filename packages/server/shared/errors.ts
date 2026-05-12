import { ORPCError } from "@orpc/server";

export class UnauthorizedError extends ORPCError<"UNAUTHORIZED", undefined> {
	constructor(message = "Unauthorized") {
		super("UNAUTHORIZED", { message });
	}
}

export class NotOrgMemberError extends ORPCError<"FORBIDDEN", { reason: "not_org_member" }> {
	constructor() {
		super("FORBIDDEN", {
			message: "Not a member of this org",
			data: { reason: "not_org_member" },
		});
	}
}

export class UnsupportedCurrencyError extends ORPCError<"BAD_REQUEST", { code: string }> {
	constructor(opts: { code: string }) {
		super("BAD_REQUEST", {
			message: `Unsupported currency code: ${opts.code}`,
			data: { code: opts.code },
		});
	}
}

export class WeakPasswordError extends ORPCError<"BAD_REQUEST", undefined> {
	constructor(opts: { reason: string }) {
		super("BAD_REQUEST", { message: opts.reason });
	}
}

export class InvalidEmailError extends ORPCError<"BAD_REQUEST", { field: "email" }> {
	constructor() {
		super("BAD_REQUEST", { message: "Invalid email format", data: { field: "email" } });
	}
}

export class SlugTakenError extends ORPCError<"CONFLICT", undefined> {
	constructor() {
		super("CONFLICT", { message: "Slug already taken" });
	}
}

export class DuplicateMemberError extends ORPCError<"CONFLICT", undefined> {
	constructor() {
		super("CONFLICT", { message: "User is already a member of this org" });
	}
}

export class SetupAlreadyCompleteError extends ORPCError<"CONFLICT", undefined> {
	constructor() {
		super("CONFLICT", { message: "Setup already complete" });
	}
}

export class InvitationNotFoundError extends ORPCError<"NOT_FOUND", undefined> {
	constructor() {
		super("NOT_FOUND", { message: "Invitation not found" });
	}
}

export class MemberNotFoundError extends ORPCError<"NOT_FOUND", undefined> {
	constructor() {
		super("NOT_FOUND", { message: "Member not found" });
	}
}

export class TargetMemberNotFoundError extends ORPCError<"NOT_FOUND", undefined> {
	constructor() {
		super("NOT_FOUND", { message: "Target member not found" });
	}
}

export class ActivationNotFoundError extends ORPCError<"NOT_FOUND", { id: string }> {
	constructor(opts: { id: string }) {
		super("NOT_FOUND", { message: `Activation ${opts.id} not found`, data: { id: opts.id } });
	}
}

export class NoPermissionError extends ORPCError<"FORBIDDEN", undefined> {
	constructor(opts: { reason: string }) {
		super("FORBIDDEN", { message: opts.reason });
	}
}

export class SelfRoleChangeError extends ORPCError<"FORBIDDEN", undefined> {
	constructor() {
		super("FORBIDDEN", { message: "Cannot change your own role" });
	}
}

export class SelfRemovalError extends ORPCError<"BAD_REQUEST", undefined> {
	constructor() {
		super("BAD_REQUEST", { message: "Cannot remove yourself" });
	}
}

export class SelfTransferError extends ORPCError<"BAD_REQUEST", undefined> {
	constructor() {
		super("BAD_REQUEST", { message: "Cannot transfer ownership to yourself" });
	}
}

export class LastOwnerError extends ORPCError<"FORBIDDEN", { action: string }> {
	constructor(opts: { action: string }) {
		super("FORBIDDEN", {
			message: `Cannot ${opts.action} the last owner of the organization`,
			data: { action: opts.action },
		});
	}
}

export class RateLimitedError extends ORPCError<"TOO_MANY_REQUESTS", undefined> {
	constructor() {
		super("TOO_MANY_REQUESTS", { message: "Too many requests" });
	}
}

export class ServerMisconfiguredError extends ORPCError<"INTERNAL_SERVER_ERROR", undefined> {
	constructor(opts: { reason: string }) {
		super("INTERNAL_SERVER_ERROR", { message: opts.reason });
	}
}

export class InvalidTokenError extends ORPCError<"UNAUTHORIZED", undefined> {
	constructor(opts: { reason: string; cause?: unknown }) {
		super("UNAUTHORIZED", { message: opts.reason, cause: opts.cause });
	}
}

/** Drizzle sometimes wraps pg errors - original sits on `cause`. */
type PgErrorShape = {
	code?: string;
	constraint?: string;
	message?: string;
	cause?: PgErrorShape;
};

function isPgError(e: unknown): e is PgErrorShape {
	return typeof e === "object" && e !== null;
}

/** SQLSTATE 23505 anywhere in the error chain. */
export function isPgUniqueViolation(e: unknown): boolean {
	if (!isPgError(e)) return false;
	return e.code === "23505" || e.cause?.code === "23505" || /unique/i.test(e.message ?? "");
}

/** 23505 matching a specific constraint substring. */
export function isPgUniqueViolationOn(e: unknown, constraint: string): boolean {
	if (!isPgError(e)) return false;
	const cause = e.cause ?? e;
	return cause.code === "23505" && (cause.constraint?.includes(constraint) ?? false);
}
