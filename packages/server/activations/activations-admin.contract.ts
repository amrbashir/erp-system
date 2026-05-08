import { oc } from "@orpc/contract";
import * as z from "zod";

const activationOutput = z.object({
	id: z.string(),
	hardwareId: z.string(),
	status: z.enum(["pending", "active", "revoked"]),
	activatedAt: z.union([z.string(), z.date()]).nullable(),
	createdAt: z.union([z.string(), z.date()]),
	updatedAt: z.union([z.string(), z.date()]),
});

export const adminActivationsContract = {
	list: oc.route({ method: "GET", path: "/activations" }).output(z.array(activationOutput)),
	toggleStatus: oc
		.route({ method: "PATCH", path: "/activations/{id}" })
		.input(z.object({ id: z.uuid(), status: z.enum(["active", "revoked"]) })),
};
