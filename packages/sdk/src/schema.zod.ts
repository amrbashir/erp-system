import { z } from "zod";

export const CreateOrgDto = z
  .object({
    name: z.string(),
    slug: z.string().optional(),
    username: z.string(),
    password: z.string().min(8),
  })
  .passthrough();

export const CreateUserDto = z
  .object({ username: z.string(), password: z.string().min(8), organization: z.string() })
  .passthrough();

export const UserEntity = z
  .object({
    username: z.string(),
    role: z.enum(["USER", "ADMIN"]),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    deletedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();

export const LoginUserDto = z
  .object({ username: z.string(), password: z.string(), organization: z.string() })
  .passthrough();

export const LoginResponseDto = z
  .object({ username: z.string(), accessToken: z.string() })
  .passthrough();

export const RefreshTokenResponseDto = z.object({ accessToken: z.string() }).passthrough();

export const CreateCustomerDto = z
  .object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    organization: z.string(),
  })
  .passthrough();

export const CustomerEntity = z
  .object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    id: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    deletedAt: z.string().datetime({ offset: true }).optional(),
    organizationId: z.string(),
  })
  .passthrough();
