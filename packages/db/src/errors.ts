import * as errore from "errore";

export class MissingEnvError extends errore.createTaggedError({
	name: "MissingEnvError",
	message: "$envName environment variable is required",
}) {}

export class DatabaseNotInitializedError extends errore.createTaggedError({
	name: "DatabaseNotInitializedError",
	message: "Database not initialized",
}) {}
