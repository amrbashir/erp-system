import { authenticatedProcedure } from "@/auth/authenticated.procedure.ts";
import { publicProcedure } from "@/trpc/index.ts";

import { OrgSlugDto } from "./org.dto.ts";

export const orgProcedure = publicProcedure.input(OrgSlugDto);
export const authenticatedOrgProcedure = authenticatedProcedure.concat(orgProcedure);
