import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import * as argon2 from "argon2";

import type { PaginationDto } from "@/pagination.dto.ts";
import type { PrismaClient } from "@/prisma-client.ts";
import type { User, UserOrderByWithRelationInput, UserWhereInput } from "@/prisma.ts";
import { UserRole } from "@/prisma.ts";

import type { CreateUserDto } from "./user.dto.ts";

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(createUserDto: CreateUserDto, orgSlug: string): Promise<User> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingUser = await prisma.user.findFirst({
          where: { username: createUserDto.username, organization: { slug: orgSlug } },
        });

        if (existingUser)
          throw new TRPCError({
            code: "CONFLICT",
            message: "User with this username already exists in the organization",
          });

        return prisma.user.create({
          data: {
            username: createUserDto.username,
            password: await argon2.hash(createUserDto.password),
            role: createUserDto.role,
            organization: { connect: { slug: orgSlug } },
          },
        });
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  async delete(id: string, orgSlug: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        const org = await prisma.organization.findUnique({
          where: { slug: orgSlug },
          include: {
            users: {
              where: {
                deletedAt: null, // Ensure we only consider non-deleted users
                role: { equals: UserRole.ADMIN },
              },
            },
          },
        });

        if (!org)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization with this slug does not exist",
          });

        if (org.users.length === 1 && id === org.users[0].id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot delete the last admin user in the organization",
          });
        }

        await prisma.user.update({
          data: { deletedAt: new Date() },
          where: { id, organizationId: org.id },
        });
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User with this ID does not exist in the organization",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  async findByUsernameInOrg(username: string, orgSlug: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        where: { username, deletedAt: null, organization: { slug: orgSlug } },
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  async getAll(
    orgSlug: string,
    options?: {
      pagination?: PaginationDto;
      where?: Omit<UserWhereInput, "organization" | "organizationId">;
      orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[] | undefined;
    },
  ): Promise<User[]> {
    try {
      return await this.prisma.user.findMany({
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        where: {
          ...options?.where,
          organization: { slug: orgSlug },
        },
        orderBy: options?.orderBy ?? { createdAt: "desc" },
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }
}
