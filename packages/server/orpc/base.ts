import { os } from "@orpc/server";

import type { AppContext } from "./context.js";

/**
 * Base oRPC builder typed with `AppContext`. Domain routers chain off this
 * to inherit the service fields. Use `pub` for procedures that don't need
 * auth; future `auth`/`org` builders will layer middleware on top.
 */
export const pub = os.$context<AppContext>();
