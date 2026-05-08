import { oc } from "@orpc/contract";
import * as z from "zod";

const activationCheckOutput = z.union([
	z.object({ token: z.string() }),
	z.object({ status: z.enum(["pending", "revoked"]) }),
]);

export const activationsContract = {
	check: oc
		.route({ method: "POST", path: "/activations/check" })
		.input(z.object({ hardwareId: z.string().min(1) }))
		.output(activationCheckOutput),
};
