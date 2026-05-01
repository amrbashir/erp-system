import { APIError } from "better-auth";
import * as errore from "errore";
import { HTTPError } from "h3";

import {
	ActivationNotFoundError,
	DuplicateMemberError,
	ForbiddenError,
	InvalidEmailError,
	InvalidInputError,
	InvalidSlugError,
	InvalidTokenError,
	InvitationNotFoundError,
	LastOwnerError,
	MemberNotFoundError,
	NoOrgSelectedError,
	NoPermissionError,
	NotOrgMemberError,
	RateLimitedError,
	SelfRemovalError,
	SelfRoleChangeError,
	SelfTransferError,
	ServerMisconfiguredError,
	SetupAlreadyCompleteError,
	SlugTakenError,
	TargetMemberNotFoundError,
	UnauthorizedError,
	UnsupportedCurrencyError,
	WeakPasswordError,
} from "./errors.js";

// Union of every tagged error mapped by toHTTPError. Cast at the boundary so
// matchError can infer handler shape; runtime dispatch uses _tag regardless.
export type AppError =
	| InvalidInputError
	| InvalidSlugError
	| UnsupportedCurrencyError
	| WeakPasswordError
	| InvalidEmailError
	| NoOrgSelectedError
	| SelfRemovalError
	| SelfTransferError
	| UnauthorizedError
	| InvalidTokenError
	| ForbiddenError
	| NotOrgMemberError
	| NoPermissionError
	| SelfRoleChangeError
	| LastOwnerError
	| MemberNotFoundError
	| TargetMemberNotFoundError
	| ActivationNotFoundError
	| InvitationNotFoundError
	| SlugTakenError
	| DuplicateMemberError
	| SetupAlreadyCompleteError
	| RateLimitedError
	| ServerMisconfiguredError
	| Error;

export function toHTTPError(err: unknown): HTTPError {
	// defensive: TS-only signature, runtime can receive anything (string throw, etc.)
	if (!(err instanceof Error)) {
		return new HTTPError(typeof err === "string" ? err : "Internal Server Error", {
			status: 500,
		});
	}
	// better-auth APIError carries its own status; preserve it instead of the 500 fallback.
	if (err instanceof APIError) {
		const status = typeof err.statusCode === "number" ? err.statusCode : 500;
		return new HTTPError(err.message, { status });
	}
	return errore.matchError(err as AppError, {
		// 400
		InvalidInputError: (e) => new HTTPError(e.message, { status: 400 }),
		InvalidSlugError: (e) => new HTTPError(e.message, { status: 400 }),
		UnsupportedCurrencyError: (e) => new HTTPError(e.message, { status: 400 }),
		WeakPasswordError: (e) => new HTTPError(e.message, { status: 400 }),
		InvalidEmailError: (e) => new HTTPError(e.message, { status: 400 }),
		NoOrgSelectedError: (e) => new HTTPError(e.message, { status: 400 }),
		SelfRemovalError: (e) => new HTTPError(e.message, { status: 400 }),
		SelfTransferError: (e) => new HTTPError(e.message, { status: 400 }),
		// 401
		UnauthorizedError: (e) => new HTTPError(e.message, { status: 401 }),
		InvalidTokenError: (e) => new HTTPError(e.message, { status: 401 }),
		// 403
		ForbiddenError: (e) => new HTTPError(e.message, { status: 403 }),
		NotOrgMemberError: (e) => new HTTPError(e.message, { status: 403 }),
		NoPermissionError: (e) => new HTTPError(e.message, { status: 403 }),
		SelfRoleChangeError: (e) => new HTTPError(e.message, { status: 403 }),
		LastOwnerError: (e) => new HTTPError(e.message, { status: 403 }),
		// 404
		MemberNotFoundError: (e) => new HTTPError(e.message, { status: 404 }),
		TargetMemberNotFoundError: (e) => new HTTPError(e.message, { status: 404 }),
		ActivationNotFoundError: (e) => new HTTPError(e.message, { status: 404 }),
		InvitationNotFoundError: (e) => new HTTPError(e.message, { status: 404 }),
		// 409
		SlugTakenError: (e) => new HTTPError(e.message, { status: 409 }),
		DuplicateMemberError: (e) => new HTTPError(e.message, { status: 409 }),
		SetupAlreadyCompleteError: (e) => new HTTPError(e.message, { status: 409 }),
		// 429
		RateLimitedError: (e) => new HTTPError(e.message, { status: 429 }),
		// 500
		ServerMisconfiguredError: (e) => new HTTPError(e.message, { status: 500 }),
		// fallback
		Error: (e) => new HTTPError(e.message, { status: 500 }),
	});
}
