import { oc } from "@orpc/contract";
import * as z from "zod";

const orgListItem = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	defaultCurrency: z.string(),
});

const orgOutput = z
	.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
	})
	.loose();

export const orgsContract = {
	list: oc.route({ method: "GET", path: "/orgs" }).output(z.array(orgListItem)),
	create: oc
		.route({ method: "POST", path: "/orgs" })
		.input(
			z.object({
				name: z.string().min(1),
				slug: z.string().min(1),
				currency: z.string().optional(),
			}),
		)
		.output(orgOutput),
};
