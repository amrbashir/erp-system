import { defineEventHandler, toRequest } from "h3";

import { auth } from "#auth";

export default defineEventHandler(async (event) => {
	return auth.handler(toRequest(event as any));
});
