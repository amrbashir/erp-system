import { RPCHandler } from "@orpc/server/fetch";

import type { AppContext } from "./context.js";
import { router } from "./router.js";

/**
 * Single shared RPCHandler instance. Created once at module load —
 * services will be instantiated as flat const refs alongside it once
 * Phase 2 lands (e.g. `const orgsService = new OrgsService(...)` then
 * passed via the `context` factory below).
 */
export const rpcHandler = new RPCHandler<AppContext>(router);
