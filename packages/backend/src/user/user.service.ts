import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./user.dto";
import { UserRole, type User } from "../prisma/generated/client";
import * as argon2 from "argon2";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto & { role?: UserRole }): Promise<User | null> {
    const hashedPassword = await argon2.hash(createUserDto.password);

    return this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password: hashedPassword,
        organizationId: createUserDto.organizationId,
        role: createUserDto.role || UserRole.USER, // Default to USER role if not provided
      },
    });
  }

  async findByIdinOrg(userId: string, organizationId?: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId, organizationId },
    });
  }

  async findByUsernameInOrg(username: string, organizationId?: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username, organizationId },
    });
  }

  async updateRefreshToken(userId: string, refreshToken?: string): Promise<User | null> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
