import { z } from "zod";

export type LoginUserDto = z.infer<typeof loginUserSchema>;
export const loginUserSchema = z.object({
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

export type JwtTokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string; // User ID
  organizationId: string; // Organization ID
};
