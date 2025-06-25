import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DeleteUserDto, type CreateUserDto } from "./user.dto";
import { UserRole, type User } from "../prisma/generated/";
import * as argon2 from "argon2";
import type { UserWhereInput } from "../prisma/generated/models";
import type { PaginationDto } from "../pagination.dto";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto, orgSlug: string): Promise<User> {
    const hashedPassword = await argon2.hash(createUserDto.password);

    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    if (!org) throw new NotFoundException("Organization with this slug does not exist");

    const existingUser = await this.prisma.user.findFirst({
      where: { username: createUserDto.username, organizationId: org.id },
    });

    if (existingUser) {
      throw new ConflictException("User with this username already exists in the organization");
    }

    return this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password: hashedPassword,
        organizationId: org.id,
        role: createUserDto.role,
      },
    });
  }

  async deleteUser(deleteUserDto: DeleteUserDto, orgSlug: string): Promise<void> {
    const org = await this.prisma.organization.findUnique({
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

    const user = await this.prisma.user.findFirst({
      where: {
        username: deleteUserDto.username,
        organizationId: org.id,
      },
    });

    if (!user) {
      throw new NotFoundException("User with this username does not exist in the organization");
    }

    await this.prisma.user.update({
      data: {
        deletedAt: new Date(),
      },
      where: {
        id: user.id,
        organizationId: org.id,
      },
    });
  }

  async findByIdinOrg(userId: string, organizationId?: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId, organizationId, deletedAt: null },
    });
  }

  async findByUsernameInOrg(username: string, orgSlug?: string): Promise<User | null> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!org) throw new NotFoundException("Organization with this slug does not exist");

    return this.prisma.user.findFirst({
      where: { username, organizationId: org.id, deletedAt: null },
    });
  }

  async updateRefreshToken(userId: string, refreshToken?: string): Promise<void> {
    this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async getAllUsers(
    organization: string,
    options?: {
      pagination?: PaginationDto;
      sort?: { field?: string; order?: "asc" | "desc" };
      where?: UserWhereInput;
    },
  ): Promise<Omit<User, "password" | "refreshToken">[]> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: organization },
    });

    if (!org) throw new NotFoundException("Organization with this slug does not exist");

    return this.prisma.user.findMany({
      where: { ...options?.where, organizationId: org.id },
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
  }
}
