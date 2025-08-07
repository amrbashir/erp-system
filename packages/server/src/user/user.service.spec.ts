import { OrgService } from "@/org/org.service.ts";
import { PrismaClient } from "@/prisma-client.ts";
import { UserRole } from "@/prisma.ts";
import { generateRandomOrgData, useRandomDatabase } from "@erp-system/utils/test.ts";
import { expect } from "@std/expect";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

import { UserService } from "./user.service.ts";

describe("UserService", () => {
  let userService: UserService;
  let orgService: OrgService;
  let prisma: PrismaClient;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaClient();
    orgService = new OrgService(prisma);
    userService = new UserService(prisma);
  });

  afterAll(dropDatabase);

  it("should create a user with valid data", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createUserDto = {
      username: "testuser",
      password: "12345678",
    };
    const user = await userService.create(createUserDto, org.slug);
    expect(user).toBeDefined();
    expect(user.username).toBe(createUserDto.username);
  });

  it("should throw an error when creating a user with an existing username", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createUserDto = {
      username: "testuser",
      password: "12345678",
    };

    await userService.create(createUserDto, org.slug);

    const result = userService.create(createUserDto, org.slug);
    await expect(result).rejects.toThrow();
  });

  it("should return users based on pagination", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const user1 = await userService.create(
      {
        username: "testuser",
        password: "12345678",
      },
      org.slug,
    );
    const user2 = await userService.create(
      {
        username: "testuser2",
        password: "12345678",
      },
      org.slug,
    );
    const user3 = await userService.create(
      {
        username: "testuser3",
        password: "12345678",
      },
      org.slug,
    );

    const orderBy = { createdAt: "asc" } as const;

    const users = await userService.getAll(org.slug, {
      pagination: { skip: 0, take: 1 },
      orderBy,
    });
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe(orgData.username);

    const users2 = await userService.getAll(org.slug, {
      pagination: { skip: 1, take: 1 },
      orderBy,
    });
    expect(users2).toHaveLength(1);
    expect(users2[0].username).toBe(user1.username);

    const users3 = await userService.getAll(org.slug, {
      pagination: { skip: 2, take: 2 },
      orderBy,
    });
    expect(users3).toHaveLength(2);
    expect(users3[0].username).toBe(user2.username);
    expect(users3[1].username).toBe(user3.username);
  });

  it("should delete a user", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);
    // Get admin user
    const admin = await prisma.user.findFirstOrThrow({
      where: { organizationId: org.id, username: "admin" },
    });

    const user1 = await userService.create(
      {
        username: "testuser",
        password: "12345678",
      },
      org.slug,
    );
    const user2 = await userService.create(
      {
        username: "testuser2",
        password: "12345678",
        role: UserRole.ADMIN,
      },
      org.slug,
    );
    const user3 = await userService.create(
      {
        username: "testuser3",
        password: "12345678",
      },
      org.slug,
    );

    await userService.delete(user1.id, org.slug);
    let users = await userService.getAll(org.slug, { where: { deletedAt: null } });
    expect(users).toHaveLength(3);

    await userService.delete(admin.id, org.slug);
    users = await userService.getAll(org.slug, { where: { deletedAt: null } });
    expect(users).toHaveLength(2);

    const deleteAdminResult = userService.delete(user2.id, org.slug);
    await expect(deleteAdminResult).rejects.toThrow();

    await userService.delete(user3.id, org.slug);
    users = await userService.getAll(org.slug, { where: { deletedAt: null } });
    expect(users).toHaveLength(1);
  });
});
