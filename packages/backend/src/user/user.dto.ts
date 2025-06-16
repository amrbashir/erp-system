import { z } from "zod";
import { createZodDto } from "../zod.pipe";

export const CreateUserSchema = z.object({
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

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
