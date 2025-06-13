import { z } from "zod";

export type CreateOrgDto = z.infer<typeof createOrgSchema>;
export const createOrgSchema = z.object({
  name: z.string().nonempty(),
  slug: z
    .string()
    .regex(/^[\x00-\x7F]+$/) // ascii
    .optional(),
  username: z
    .string()
    .nonempty()
    .regex(/^[a-zA-Z0-9]+$/), // alphanumeric
  password: z
    .string()
    .nonempty()
    .min(8)
    .regex(/^[\x00-\x7F]+$/), // ascii
});
