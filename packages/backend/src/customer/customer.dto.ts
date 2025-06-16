import { z } from "zod/v4";
import { createZodDto } from "../zod.pipe";

export const CreateCustomerSchema = z.object({
  name: z.string().nonempty(),
  email: z.email().optional(),
  phone: z.string().optional(),
  organizationId: z.uuid().nonempty(),
});

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}
