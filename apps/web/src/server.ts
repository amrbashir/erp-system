import handler from "@tanstack/react-start/server-entry";
import { paraglideMiddleware } from "@workspace/i18n/paraglide/server";

// Pass original `req` - NOT the modified `request` from the callback, since
// TanStack Router handles URL localization itself.
export default {
	fetch(req: Request): Promise<Response> {
		return paraglideMiddleware(req, () => handler.fetch(req));
	},
};
