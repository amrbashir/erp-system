import { authenticatedProcedure } from "@/auth/authenticated.procedure.ts";
import { otelProcedure } from "@/otel/trpc-procedure.ts";

import { OrgSlugDto } from "./org.dto.ts";

export const orgProcedure = otelProcedure.input(OrgSlugDto);
export const authenticatedOrgProcedure = authenticatedProcedure.concat(orgProcedure);
