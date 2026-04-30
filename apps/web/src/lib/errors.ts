import * as errore from "errore";

export class InvalidTokenError extends errore.createTaggedError({
	name: "InvalidTokenError",
	message: "$reason",
}) {}

export class ApiError extends errore.createTaggedError({
	name: "ApiError",
	message: "$message",
}) {}

export class JsonParseError extends errore.createTaggedError({
	name: "JsonParseError",
	message: "Failed to parse response body",
}) {}

export class ActivationMisconfiguredError extends errore.createTaggedError({
	name: "ActivationMisconfiguredError",
	message: "Activation API URL not configured",
}) {}
