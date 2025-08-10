import z from "zod";

import { UserRole } from "../prisma/index.ts";

export const CreateUserDto = z.object({
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric"),
  password: z
    .string()
    .min(8)
    .regex(/^[!-~]+$/, "Password must be ASCII"),
  role: z.enum(UserRole).optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const DeleteUserDto = z.object({
  userId: z.uuid(),
});

export type DeleteUserDto = z.infer<typeof DeleteUserDto>;
