import { defineEventHandler, toRequest } from "h3";
import { auth } from "../../../../src/lib/auth";

export default defineEventHandler(async (event) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return auth.handler(toRequest(event as any));
});
