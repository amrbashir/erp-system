import type { AnyRoute } from "@tanstack/react-router";

import { createActivationRoute } from "./activation";
import { createSetupRoute } from "./setup";

/**
 * Code-based routes appended to the host app's tree at runtime. Web guards
 * redirect away; root `runDesktopGate` orchestrates the desktop flow.
 */
export function createDesktopRoutes(rootRoute: AnyRoute) {
	return [createActivationRoute(rootRoute), createSetupRoute(rootRoute)];
}
