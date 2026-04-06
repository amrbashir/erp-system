import { defineEventHandler } from "h3";
import { auth } from "../../../../src/lib/auth";

export default defineEventHandler((event) =>
	auth.handler(event.req as unknown as Request),
);
