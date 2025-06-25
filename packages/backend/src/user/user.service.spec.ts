import { it, expect, beforeEach, afterEach, describe } from "vitest";
import { UserService } from "./user.service";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { useRandomDatabase } from "../../e2e/utils";
import { UserRole } from "../prisma/generated/client";

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
    };
    const user = await service.createUser(createUserDto, org.slug);
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
    };

    await service.createUser(createUserDto, org.slug);

    await expect(service.createUser(createUserDto, org.slug)).rejects.toThrow();
  });

  it("should return all users without passwords", async () => {
    const createOrgDto = {
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    };

    const org = await orgService.create(createOrgDto);

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

    const users = await service.getAllUsers(org.slug);
    expect(users).toHaveLength(3);
    expect(users[1].username).toBe(user1!.username);
    expect(users[2].username).toBe(user2!.username);
    // @ts-expect-error getAllUsers omits password in the return type
    expect(users[0].password).toBeUndefined();
    // @ts-expect-error getAllUsers omits password in the return type
    expect(users[1].password).toBeUndefined();
    // @ts-expect-error getAllUsers omits password in the return type
    expect(users[2].password).toBeUndefined();
    // @ts-expect-error getAllUsers omits refreshToken in the return type
    expect(users[0].refreshToken).toBeUndefined();
    // @ts-expect-error getAllUsers omits refreshToken in the return type
    expect(users[1].refreshToken).toBeUndefined();
    // @ts-expect-error getAllUsers omits refreshToken in the return type
    expect(users[2].refreshToken).toBeUndefined();
  });

  it("should return users based on pagination", async () => {
    const createOrgDto = {
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    };

    const org = await orgService.create(createOrgDto);

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

    const sort = { field: "createdAt", order: "asc" } as const;

    const users = await service.getAllUsers(org.slug, { sort, pagination: { skip: 0, take: 1 } });
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe(createOrgDto.username);

    const users2 = await service.getAllUsers(org.slug, {
      sort,
      pagination: { skip: 1, take: 1 },
    });
    expect(users2).toHaveLength(1);
    expect(users2[0].username).toBe(user1.username);

    const users3 = await service.getAllUsers(org.slug, {
      sort,
      pagination: { skip: 2, take: 2 },
    });
    expect(users3).toHaveLength(2);
    expect(users3[0].username).toBe(user2!.username);
    expect(users3[1].username).toBe(user3!.username);
  });

  it("should delete a user", async () => {
    const createOrgDto = {
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    };

    const org = await orgService.create(createOrgDto);

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

    const where = { deletedAt: null } as const;

    await service.deleteUser({ username: user1.username }, org.slug);
    let users = await service.getAllUsers(org.slug, { where });
    expect(users).toHaveLength(3);

    await service.deleteUser({ username: createOrgDto.username }, org.slug);
    users = await service.getAllUsers(org.slug, { where });
    expect(users).toHaveLength(2);

    expect(service.deleteUser({ username: user2.username }, org.slug)).rejects.toThrow();

    await service.deleteUser({ username: user3.username }, org.slug);
    users = await service.getAllUsers(org.slug, { where });
    expect(users).toHaveLength(1);
  });
});
