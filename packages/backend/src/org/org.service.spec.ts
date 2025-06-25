import { it, expect, beforeEach, afterEach, describe } from "vitest";
import { OrgService } from "./org.service";
import { PrismaService } from "../prisma/prisma.service";
import { useRandomDatabase } from "../../e2e/utils";
import { UserRole } from "../prisma/generated";
import argon2 from "argon2";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { slugify } from "@tech-zone-store/utils";

describe("OrgService", async () => {
  let service: OrgService;
  let prisma: PrismaService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeEach(async () => {
    await createDatabase();
    prisma = new PrismaService();
    service = new OrgService(prisma);
  });

  afterEach(async () => await dropDatabase());

  it("should create an organization with valid data", async () => {
    const createOrgDto = {
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    };
    const org = await service.create(createOrgDto);
    expect(org).toBeDefined();
    expect(org!.name).toBe("Test Org");
    expect(org!.slug).toBe("test-org");

    const users = await prisma.user.findMany({
      where: { organizationId: org!.id },
    });
    expect(users.length).toBe(1);
    expect(users[0].username).toBe("admin");
    expect(users[0].role).toBe(UserRole.ADMIN);
    expect(await argon2.verify(users[0].password, "12345678")).toBe(true);

    const stores = await prisma.store.findMany({
      where: { organizationId: org!.id },
    });
    expect(stores.length).toBe(1);
    expect(stores[0].name).toBe("Default");
    expect(stores[0].slug).toBe("default");
  });

  it("should throw BadRequestException for invalid slug", async () => {
    const createOrgDto = {
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "invalid slug",
    };
    await expect(service.create(createOrgDto)).rejects.toThrow(BadRequestException);
  });

  it("should throw ConflictException for existing organization", async () => {
    const createOrgDto = {
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    };
    await service.create(createOrgDto); // create for the first time
    await expect(service.create(createOrgDto)).rejects.toThrow(ConflictException);
  });

  it("should create an organization without slug", async () => {
    const createOrgDto = { name: "Another Org", username: "admin2", password: "12345678" };
    const org = await service.create(createOrgDto);
    expect(org).toBeDefined();
    expect(org!.name).toBe("Another Org");
    expect(org!.slug).toBe(slugify("Another Org"));
  });

  it("should check if organization exists", async () => {
    const createOrgDto = {
      name: "Check Org",
      username: "admin3",
      password: "12345678",
      slug: "check-org",
    };
    await service.create(createOrgDto);
    const exists = await service.exists("check-org");
    expect(exists).toBe(true);
  });

  it("should create multiple organizations with different slugs", async () => {
    const org1 = await service.create({
      name: "Org One",
      username: "admin1",
      password: "password1",
      slug: "org-one",
    });
    expect(org1.slug).toBe("org-one");

    const org2 = await service.create({
      name: "Org Two",
      username: "admin2",
      password: "password2",
      slug: "org-two",
    });
    expect(org2.slug).toBe("org-two");

    const exists1 = await service.exists("org-one");
    const exists2 = await service.exists("org-two");
    expect(exists1).toBe(true);
    expect(exists2).toBe(true);
  });
});
