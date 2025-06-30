import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";

import type { PaginationDto } from "../pagination.dto";
import type { User } from "../prisma/generated/client";
import type { UserWhereInput } from "../prisma/generated/models";
import type { CreateUserDto } from "./user.dto";
import { UserRole } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { DeleteUserDto } from "./user.dto";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto, orgSlug: string): Promise<User> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingUser = await prisma.user.findFirst({
          where: { username: createUserDto.username, organization: { slug: orgSlug } },
        });

        if (existingUser)
          throw new ConflictException("User with this username already exists in the organization");

        return prisma.user.create({
          data: {
            username: createUserDto.username,
            password: await argon2.hash(createUserDto.password),
            role: createUserDto.role,
            organization: { connect: { slug: orgSlug } },
          },
        });
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }

  async deleteUser(deleteUserDto: DeleteUserDto, orgSlug: string): Promise<void> {
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

      if (!org) throw new NotFoundException("Organization with this slug does not exist");

      if (org.users.length === 1 && deleteUserDto.username === org.users[0].username) {
        throw new ForbiddenException("Cannot delete the last admin user in the organization");
      }

      const user = await prisma.user.findFirst({
        where: {
          username: deleteUserDto.username,
          organizationId: org.id,
        },
      });

      if (!user) {
        throw new NotFoundException("User with this username does not exist in the organization");
      }

      await prisma.user.update({
        data: { deletedAt: new Date() },
        where: { id: user.id, organizationId: org.id },
      });
    });
  }

  async findByIdinOrg(userId: string, organizationId?: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId, organizationId, deletedAt: null },
    });
  }

  async findByUsernameInOrg(username: string, orgSlug?: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        where: { username, deletedAt: null, organization: { slug: orgSlug } },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }

  async updateRefreshToken(userId: string, refreshToken?: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("User with this ID does not exist");
      }

      throw error; // Re-throw other errors
    }
  }

  async getAllUsers(
    orgSlug: string,
    options?: {
      pagination?: PaginationDto;
      sort?: { field?: string; order?: "asc" | "desc" };
      where?: UserWhereInput;
    },
  ): Promise<Omit<User, "password" | "refreshToken">[]> {
    try {
      return await this.prisma.user.findMany({
        where: { ...options?.where, organization: { slug: orgSlug } },
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        orderBy: options?.sort
          ? {
              [options.sort.field ?? "createdAt"]: options.sort.order ?? "asc",
            }
          : undefined,
        omit: {
          password: true,
          refreshToken: true,
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }
}
