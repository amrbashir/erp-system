// This export is separated from ./prisma.ts to avoid having runtime specific imports
// in ./prisma.ts, which is used in both server and client contexts.
//
// This allows us to use the PrismaClient in server-side code without affecting the client bundle.

export { PrismaClient } from "../prisma/generated/client.ts";
