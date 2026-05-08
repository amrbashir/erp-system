import { oc } from "@orpc/contract";
import * as z from "zod";

const sessionOutput = z
	.object({
		user: z.object({
			id: z.string(),
			name: z.string(),
			email: z.string(),
		}),
		session: z.object({ id: z.string() }),
	})
	.nullable();

export const sessionContract = {
	get: oc.route({ method: "GET", path: "/session" }).output(sessionOutput),
};
