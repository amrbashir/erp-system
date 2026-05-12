import { oc } from "@orpc/contract";
import * as z from "zod";

export const invitationsContract = {
	revoke: oc
		.route({ method: "DELETE", path: "/orgs/{orgSlug}/invitations/{invitationId}" })
		.input(z.object({ orgSlug: z.string(), invitationId: z.uuid() })),
};
