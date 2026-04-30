import * as errore from "errore";

// Auth / scope
export class UnauthorizedError extends errore.createTaggedError({
	name: "UnauthorizedError",
	message: "Unauthorized",
}) {}

export class NoOrgSelectedError extends errore.createTaggedError({
	name: "NoOrgSelectedError",
	message: "No org selected",
}) {}

export class NotOrgMemberError extends errore.createTaggedError({
	name: "NotOrgMemberError",
	message: "Not a member of this org",
}) {}

export class ForbiddenError extends errore.createTaggedError({
	name: "ForbiddenError",
	message: "$reason",
}) {}

// Validation
export class InvalidInputError extends errore.createTaggedError({
	name: "InvalidInputError",
	message: "$reason",
}) {}

export class InvalidSlugError extends errore.createTaggedError({
	name: "InvalidSlugError",
	message: "$reason",
}) {}

export class UnsupportedCurrencyError extends errore.createTaggedError({
	name: "UnsupportedCurrencyError",
	message: "Unsupported currency code: $code",
}) {}

export class WeakPasswordError extends errore.createTaggedError({
	name: "WeakPasswordError",
	message: "$reason",
}) {}

export class InvalidEmailError extends errore.createTaggedError({
	name: "InvalidEmailError",
	message: "Invalid email format",
}) {}

// Conflicts
export class SlugTakenError extends errore.createTaggedError({
	name: "SlugTakenError",
	message: "Slug already taken",
}) {}

export class DuplicateMemberError extends errore.createTaggedError({
	name: "DuplicateMemberError",
	message: "User is already a member of this org",
}) {}

export class AccountAlreadyClaimedError extends errore.createTaggedError({
	name: "AccountAlreadyClaimedError",
	message: "Account already claimed",
}) {}

export class SetupAlreadyCompleteError extends errore.createTaggedError({
	name: "SetupAlreadyCompleteError",
	message: "Setup already complete",
}) {}

// Not found
export class MemberNotFoundError extends errore.createTaggedError({
	name: "MemberNotFoundError",
	message: "Member not found",
}) {}

export class TargetMemberNotFoundError extends errore.createTaggedError({
	name: "TargetMemberNotFoundError",
	message: "Target member not found",
}) {}

export class ActivationNotFoundError extends errore.createTaggedError({
	name: "ActivationNotFoundError",
	message: "Activation $id not found",
}) {}

export class UserNotFoundError extends errore.createTaggedError({
	name: "UserNotFoundError",
	message: "No account found for this email",
}) {}

// Org / member rules
export class NoPermissionError extends errore.createTaggedError({
	name: "NoPermissionError",
	message: "$reason",
}) {}

export class SelfRoleChangeError extends errore.createTaggedError({
	name: "SelfRoleChangeError",
	message: "Cannot change your own role",
}) {}

export class SelfRemovalError extends errore.createTaggedError({
	name: "SelfRemovalError",
	message: "Cannot remove yourself",
}) {}

export class SelfTransferError extends errore.createTaggedError({
	name: "SelfTransferError",
	message: "Cannot transfer ownership to yourself",
}) {}

export class LastOwnerError extends errore.createTaggedError({
	name: "LastOwnerError",
	message: "Cannot $action the last owner of the organization",
}) {}

// Rate / config
export class RateLimitedError extends errore.createTaggedError({
	name: "RateLimitedError",
	message: "Too many requests",
}) {}

export class ServerMisconfiguredError extends errore.createTaggedError({
	name: "ServerMisconfiguredError",
	message: "$reason",
}) {}

// Token / verification
export class InvalidTokenError extends errore.createTaggedError({
	name: "InvalidTokenError",
	message: "$reason",
}) {}
