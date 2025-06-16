import { z } from "zod";
import { createZodDto } from "../zod.pipe";

export const CreateCustomerSchema = z.object({
  name: z.string().nonempty(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  organizationId: z.string().uuid().nonempty(),
});

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}
