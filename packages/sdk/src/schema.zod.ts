import { z } from "zod";

export type CreateOrgDto = z.infer<typeof CreateOrgDto>;
export const CreateOrgDto = z.object({
  name: z.string(),
  slug: z.union([z.string(), z.undefined()]).optional(),
  username: z.string(),
  password: z.string(),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;
export const CreateUserDto = z.object({
  username: z.string(),
  password: z.string(),
  organization: z.string(),
});

export type UserEntity = z.infer<typeof UserEntity>;
export const UserEntity = z.object({
  username: z.string(),
  role: z.union([z.literal("USER"), z.literal("ADMIN")]),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.union([z.string(), z.undefined()]).optional(),
});

export type LoginUserDto = z.infer<typeof LoginUserDto>;
export const LoginUserDto = z.object({
  username: z.string(),
  password: z.string(),
  organization: z.string(),
});

export type LoginResponseDto = z.infer<typeof LoginResponseDto>;
export const LoginResponseDto = z.object({
  username: z.string(),
  accessToken: z.string(),
});

export type RefreshTokenResponseDto = z.infer<typeof RefreshTokenResponseDto>;
export const RefreshTokenResponseDto = z.object({
  accessToken: z.string(),
});

export type CreateCustomerDto = z.infer<typeof CreateCustomerDto>;
export const CreateCustomerDto = z.object({
  name: z.string(),
  email: z.union([z.string(), z.undefined()]).optional(),
  phone: z.union([z.string(), z.undefined()]).optional(),
  organization: z.string(),
});

export type CustomerEntity = z.infer<typeof CustomerEntity>;
export const CustomerEntity = z.object({
  name: z.string(),
  email: z.union([z.string(), z.undefined()]).optional(),
  phone: z.union([z.string(), z.undefined()]).optional(),
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.union([z.string(), z.undefined()]).optional(),
  organizationId: z.string(),
});
