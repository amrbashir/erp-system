import { ConflictException } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { UserRole } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { UserService } from "./user.service";

describe("UserService", async () => {
  let service: UserService;
  let orgService: OrgService;
  let prisma: PrismaService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaService();
    orgService = new OrgService(prisma);
    service = new UserService(prisma);
  });

  afterAll(dropDatabase);

  it("should create a user with valid data", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createUserDto = {
      username: "testuser",
      password: "12345678",
    };
    const user = await service.createUser(createUserDto, org.slug);
    expect(user).toBeDefined();
    expect(user!.username).toBe(createUserDto.username);
  });

  it("should throw an error when creating a user with an existing username", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createUserDto = {
      username: "testuser",
      password: "12345678",
    };

    await service.createUser(createUserDto, org.slug);

    await expect(service.createUser(createUserDto, org.slug)).rejects.toThrow(ConflictException);
  });

  it("should return users based on pagination", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const user1 = await service.createUser(
      {
        username: "testuser",
        password: "12345678",
      },
      org.slug,
    );
    const user2 = await service.createUser(
      {
        username: "testuser2",
        password: "12345678",
      },
      org.slug,
    );
    const user3 = await service.createUser(
      {
        username: "testuser3",
        password: "12345678",
      },
      org.slug,
    );

    const orderBy = { createdAt: "asc" } as const;

    const users = await service.getAllUsers(org.slug, {
      pagination: { skip: 0, take: 1 },
      orderBy,
    });
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe(orgData.username);

    const users2 = await service.getAllUsers(org.slug, {
      pagination: { skip: 1, take: 1 },
      orderBy,
    });
    expect(users2).toHaveLength(1);
    expect(users2[0].username).toBe(user1.username);

    const users3 = await service.getAllUsers(org.slug, {
      pagination: { skip: 2, take: 2 },
      orderBy,
    });
    expect(users3).toHaveLength(2);
    expect(users3[0].username).toBe(user2!.username);
    expect(users3[1].username).toBe(user3!.username);
  });

  it("should delete a user", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const user1 = await service.createUser(
      {
        username: "testuser",
        password: "12345678",
      },
      org.slug,
    );
    const user2 = await service.createUser(
      {
        username: "testuser2",
        password: "12345678",
        role: UserRole.ADMIN,
      },
      org.slug,
    );
    const user3 = await service.createUser(
      {
        username: "testuser3",
        password: "12345678",
      },
      org.slug,
    );

    await service.deleteUser({ username: user1.username }, org.slug);
    let users = await service.getAllUsers(org.slug, { where: { deletedAt: null } });
    expect(users).toHaveLength(3);

    await service.deleteUser({ username: orgData.username }, org.slug);
    users = await service.getAllUsers(org.slug, { where: { deletedAt: null } });
    expect(users).toHaveLength(2);

    await expect(service.deleteUser({ username: user2.username }, org.slug)).rejects.toThrow();

    await service.deleteUser({ username: user3.username }, org.slug);
    users = await service.getAllUsers(org.slug, { where: { deletedAt: null } });
    expect(users).toHaveLength(1);
  });
});
