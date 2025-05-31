import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./user.dto";
import { UserRole } from "../prisma/generated";
import * as argon2 from "argon2";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto & { role?: UserRole }) {
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

  async findUniqueInOrg(username: string, organizationId?: number) {
    return this.prisma.user.findUnique({
      where: { username, organizationId },
    });
  }
}
