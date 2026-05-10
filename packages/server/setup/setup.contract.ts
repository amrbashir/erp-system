import { oc } from "@orpc/contract";
import * as z from "zod";

export const setupRunInput = z.object({
	email: z.string().min(1),
	password: z.string().min(1),
	name: z.string().min(1),
	orgName: z.string().min(1),
	slug: z.string().optional(),
});

const setupRunOutput = z.object({
	user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
	org: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
});

export const setupContract = {
	isComplete: oc
		.route({ method: "GET", path: "/setup" })
		.output(z.object({ setupComplete: z.boolean() })),
	run: oc.route({ method: "POST", path: "/setup" }).input(setupRunInput).output(setupRunOutput),
};
