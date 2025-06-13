import { z } from "zod/v4";

export type CreateUserDto = z.infer<typeof CreateUserDto>;
export const CreateUserDto = z.object({
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
