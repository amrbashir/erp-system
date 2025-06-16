import { z } from "zod";
import { createZodDto } from "../zod.pipe";

export const CreateOrgDtoSchema = z.object({
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

export class CreateOrgDto extends createZodDto(CreateOrgDtoSchema) {}
