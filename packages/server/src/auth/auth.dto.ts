import { z } from "zod";

import type { UserRole } from "../prisma/index.ts";

export const LoginUserDto = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty(),
});

export type LoginUserDto = z.infer<typeof LoginUserDto>;

export type LoginResponse = {
  username: string;
  role: UserRole;
  orgSlug: string;
  orgName: string;
};
