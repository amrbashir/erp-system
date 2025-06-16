import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { type CreateUserDto } from "./user.dto";
import { UserRole, type User } from "../prisma/generated/client";
import * as argon2 from "argon2";
import { useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";

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
        role: createUserDto.role,
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

  async updateRefreshToken(userId: string, refreshToken?: string): Promise<void> {
    this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    return this.prisma.user.findMany({
      omit: {
        password: true,
      },
    });
  }
}

if (import.meta.vitest) {
  const { it, expect, beforeEach, afterEach, describe } = import.meta.vitest;

  describe("UserService", async () => {
    let service: UserService;
    let orgService: OrgService;
    let prisma: PrismaService;

    const { createDatabase, dropDatabase } = useRandomDatabase();

    beforeEach(async () => {
      await createDatabase();
      prisma = new PrismaService();
      orgService = new OrgService(prisma);
      service = new UserService(prisma);
    });

    afterEach(async () => await dropDatabase());

    it("should create a user with valid data", async () => {
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      const createUserDto = {
        username: "testuser",
        password: "12345678",
        organizationId: org!.id,
      };
      const user = await service.createUser(createUserDto);
      expect(user).toBeDefined();
      expect(user!.username).toBe(createUserDto.username);
    });

    it("should throw an error when creating a user with an existing username", async () => {
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      const createUserDto = {
        username: "testuser",
        password: "12345678",
        organizationId: org!.id,
      };

      await service.createUser(createUserDto);

      await expect(service.createUser(createUserDto)).rejects.toThrow();
    });

    it("getAllUsers should return all users without passwords", async () => {
      const createOrgDto = {
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      };

      const org = await orgService.create(createOrgDto);

      const user1 = await service.createUser({
        username: "testuser",
        password: "12345678",
        organizationId: org!.id,
      });

      const user2 = await service.createUser({
        username: "testuser2",
        password: "12345678",
        organizationId: org!.id,
      });

      const users = await service.getAllUsers();
      expect(users).toHaveLength(3);
      expect(users[1].username).toBe(user1!.username);
      expect(users[2].username).toBe(user2!.username);
      // @ts-expect-error getAllUsers omits password in the return type
      expect(users[0].password).toBeUndefined();
      // @ts-expect-error getAllUsers omits password in the return type
      expect(users[1].password).toBeUndefined();
      // @ts-expect-error getAllUsers omits password in the return type
      expect(users[2].password).toBeUndefined();
    });
  });
}
