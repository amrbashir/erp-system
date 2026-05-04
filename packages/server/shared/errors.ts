import { ORPCError } from "@orpc/server";
import * as errore from "errore";

// ── Public errors (extend ORPCError) ─────────────────────────────────────────
// Surface to clients. Code → HTTP status mapping is built into ORPCError.

// Auth / scope
export class UnauthorizedError extends ORPCError<"UNAUTHORIZED", undefined> {
	constructor(message = "Unauthorized") {
		super("UNAUTHORIZED", { message });
	}
}

export class NoOrgSelectedError extends ORPCError<"BAD_REQUEST", { reason: "no_org_selected" }> {
	constructor() {
		super("BAD_REQUEST", { message: "No org selected", data: { reason: "no_org_selected" } });
	}
}

export class NotOrgMemberError extends ORPCError<"FORBIDDEN", { reason: "not_org_member" }> {
	constructor() {
		super("FORBIDDEN", { message: "Not a member of this org", data: { reason: "not_org_member" } });
	}
}

export class ForbiddenError extends ORPCError<"FORBIDDEN", undefined> {
	constructor(opts: { reason: string }) {
		super("FORBIDDEN", { message: opts.reason });
	}
}

// Validation
export class InvalidInputError extends ORPCError<"BAD_REQUEST", undefined> {
	constructor(opts: { reason: string }) {
		super("BAD_REQUEST", { message: opts.reason });
	}
}

export class InvalidSlugError extends ORPCError<"BAD_REQUEST", undefined> {
	constructor(opts: { reason: string }) {
		super("BAD_REQUEST", { message: opts.reason });
	}
}

export class UnsupportedCurrencyError extends ORPCError<"BAD_REQUEST", { code: string }> {
	constructor(opts: { code: string }) {
		super("BAD_REQUEST", { message: `Unsupported currency code: ${opts.code}`, data: { code: opts.code } });
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

// Conflicts
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

// Not found
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

// Org / member rules
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

// Rate / config
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

// Token / verification
export class InvalidTokenError extends ORPCError<"UNAUTHORIZED", undefined> {
	constructor(opts: { reason: string; cause?: unknown }) {
		super("UNAUTHORIZED", { message: opts.reason, cause: opts.cause });
	}
}

// ── Internal errors (errore tagged, never cross transport) ──────────────────
// Boot, infra, library wrappers. Discriminate via `instanceof`.

// Add internal errors here as they arise. Example shape:
//
// export class MigrationFailedError extends errore.createTaggedError({
// 	name: "MigrationFailedError",
// 	message: "Migration $migration failed: $reason",
// }) {}

// Re-export errore for callers that build internal tagged errors elsewhere.
export { errore };

// ── Catch-block helpers ─────────────────────────────────────────────────────

/**
 * Structural shape of pg/drizzle errors thrown from a query. Postgres
 * errors carry SQLSTATE codes (e.g. "23505" = unique_violation). drizzle
 * sometimes wraps them so the original sits on `cause`.
 */
export type PgErrorShape = {
	code?: string;
	constraint?: string;
	message?: string;
	cause?: PgErrorShape;
};
