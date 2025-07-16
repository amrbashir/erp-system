import { slugify } from "@erp-system/utils";
import { BadRequestException } from "@nestjs/common";
import argon2 from "argon2";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { UserRole } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { OrgService } from "./org.service";

describe("OrgService", async () => {
  let service: OrgService;
  let prisma: PrismaService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaService();
    service = new OrgService(prisma);
  });

  afterAll(dropDatabase);

  it("should create an organization with valid data", async () => {
    const orgData = generateRandomOrgData();
    const org = await service.create(orgData);

    expect(org).toBeDefined();
    expect(org!.name).toBe(orgData.name);
    expect(org!.slug).toBe(orgData.slug);

    const users = await prisma.user.findMany({
      where: { organizationId: org!.id },
    });
    expect(users.length).toBe(1);
    expect(users[0].username).toBe("admin");
    expect(users[0].role).toBe(UserRole.ADMIN);
    expect(await argon2.verify(users[0].password, "12345678")).toBe(true);
  });

  it("should throw BadRequestException for invalid slug", async () => {
    const orgData = generateRandomOrgData();
    orgData.slug = "invalid slug"; // Invalid slug with space
    await expect(service.create(orgData)).rejects.toThrow(BadRequestException);
  });

  it("should throw ConflictException for existing organization", async () => {
    const orgData = generateRandomOrgData();
    await service.create(orgData); // create for the first time
    await expect(service.create(orgData)).rejects.toThrow();
  });

  it("should create an organization without slug", async () => {
    const orgData = generateRandomOrgData();
    orgData.slug = undefined as any;

    const org = await service.create(orgData);

    expect(org).toBeDefined();
    expect(org!.name).toBe(orgData.name);
    expect(org!.slug).toBe(slugify(orgData.name));
  });

  it("should get organization if exists", async () => {
    const orgData = generateRandomOrgData();
    await service.create(orgData);

    const retrieved = await service.findOrgBySlug(orgData.slug);

    expect(retrieved).toMatchObject({
      name: orgData.name,
      slug: orgData.slug,
    });
  });

  it("should create multiple organizations with different slugs", async () => {
    const org1Data = generateRandomOrgData();
    const org1 = await service.create(org1Data);

    const org2Data = generateRandomOrgData();
    const org2 = await service.create(org2Data);

    expect(org1.slug).toBe(org1Data.slug);
    expect(org2.slug).toBe(org2Data.slug);

    const retrieved1 = await service.findOrgBySlug(org1Data.slug);
    const retrieved2 = await service.findOrgBySlug(org2Data.slug);

    expect(retrieved1).toBeDefined();
    expect(retrieved2).toBeDefined();
  });
});
