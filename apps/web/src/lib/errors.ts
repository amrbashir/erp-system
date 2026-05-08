import * as errore from "errore";

export class InvalidTokenError extends errore.createTaggedError({
	name: "InvalidTokenError",
	message: "$reason",
}) {}

export class ApiError extends errore.createTaggedError({
	name: "ApiError",
	message: "$message",
}) {}

export class ActivationMisconfiguredError extends errore.createTaggedError({
	name: "ActivationMisconfiguredError",
	message: "Activation API URL not configured",
}) {}
