import { z } from "zod";

export const CreateOrgDto = z
  .object({
    name: z.string(),
    slug: z.string().optional(),
    username: z.string(),
    password: z.string().min(8),
  })
  .passthrough();

export const OrganizationEntity = z.object({ name: z.string(), slug: z.string() }).passthrough();

export const CreateUserDto = z
  .object({
    username: z.string(),
    password: z.string().min(8),
    role: z.enum(["USER", "ADMIN"]).optional(),
  })
  .passthrough();

export const DeleteUserDto = z.object({ username: z.string() }).passthrough();

export const UserEntity = z
  .object({
    username: z.string(),
    role: z.enum(["USER", "ADMIN"]),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    deletedAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();

export const LoginUserDto = z.object({ username: z.string(), password: z.string() }).passthrough();

export const LoginResponseDto = z
  .object({ username: z.string(), role: z.enum(["USER", "ADMIN"]), accessToken: z.string() })
  .passthrough();

export const RefreshTokenResponseDto = z.object({ accessToken: z.string() }).passthrough();

export const CreateCustomerDto = z
  .object({ name: z.string(), email: z.string().email().optional(), phone: z.string().optional() })
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
