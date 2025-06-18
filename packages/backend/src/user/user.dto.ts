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
  organization: z.string(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export const PaginationSchema = z.object({
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(100).default(30),
});
export class PaginationDto extends createZodDto(PaginationSchema) {}
