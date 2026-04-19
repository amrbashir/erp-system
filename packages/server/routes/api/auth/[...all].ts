import { defineEventHandler } from "h3";

import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
	return auth.handler(event.req);
});
