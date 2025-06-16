import { z } from "zod";
import { createZodDto } from "../zod.pipe";

export const LoginUserSchema = z.object({
  username: z
    .string()
    .nonempty()
    .regex(/^[a-zA-Z0-9]+$/), // alphanumeric
  password: z
    .string()
    .nonempty()
    .min(8)
    .regex(/^[\x00-\x7F]+$/), // ascii
  organizationId: z.string().nonempty().uuid(),
});

export class LoginUserDto extends createZodDto(LoginUserSchema) {}

export type JwtTokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string; // User ID
  organizationId: string; // Organization ID
};
