import { orgRouter } from "../org/org.router.ts";
import { router } from "./index.ts";

export const appRouter = router({ orgs: orgRouter });

export type AppRouter = typeof appRouter;
