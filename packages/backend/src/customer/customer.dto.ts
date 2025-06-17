import { z } from "zod";
import { createZodDto } from "../zod.pipe";

export const CreateCustomerSchema = z.object({
  name: z.string().nonempty(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  organizationId: z.string().uuid().nonempty(),
});

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}

export const PaginationSchema = z.object({
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(100).default(30),
});
export class PaginationDto extends createZodDto(PaginationSchema) {}
