import { slugify } from "@erp-system/utils";
import { BadRequestException } from "@nestjs/common";
import argon2 from "argon2";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { Prisma, UserRole } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionService } from "../transaction/transaction.service";
import { UserService } from "../user/user.service";
import { OrgService } from "./org.service";

describe("OrgService", async () => {
  let service: OrgService;
  let prisma: PrismaService;
  let userService: UserService;
  let transactionService: TransactionService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaService();
    service = new OrgService(prisma);
    userService = new UserService(prisma);
    transactionService = new TransactionService(prisma);
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

    const result = service.create(orgData);
    await expect(result).rejects.toThrow(BadRequestException);
  });

  it("should throw ConflictException for existing organization", async () => {
    const orgData = generateRandomOrgData();
    await service.create(orgData); // create for the first time

    const result = service.create(orgData);
    await expect(result).rejects.toThrow();
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

  it("should add balance to an organization", async () => {
    const orgData = generateRandomOrgData();
    const org = await service.create(orgData);
    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    const addBalanceDto = { amount: "100", description: "Initial balance" };
    await service.addBalance(org.slug, addBalanceDto, adminUser!.id);

    const updatedOrg = await service.findOrgBySlug(org.slug);
    expect(updatedOrg).toBeDefined();
    expect(updatedOrg!.balance.toNumber()).toBe(100);

    const addBalanceDto2 = { amount: "10", description: "Adding balance 2nd time" };
    await service.addBalance(org.slug, addBalanceDto2, adminUser!.id);

    const updatedOrg2 = await service.findOrgBySlug(org.slug);
    expect(updatedOrg2).toBeDefined();
    expect(updatedOrg2!.balance.toNumber()).toBe(110);

    const transactions = await transactionService.getAllTransactions(org.slug, {
      orderBy: { createdAt: "asc" },
    });
    expect(transactions.length).toBe(2);
    expect(transactions[0].amount.toNumber()).toBe(100);
    expect(transactions[1].amount.toNumber()).toBe(10);
    expect(transactions[0].cashierId).toBe(adminUser!.id);
    expect(transactions[1].cashierId).toBe(adminUser!.id);
  });

  it("should return correct statistics for an organization", async () => {
    const orgData = generateRandomOrgData();
    const org = await service.create(orgData);
    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    function createTransaction(amount: string, createdAt: Date) {
      return prisma.$transaction(async (prisma) => {
        await prisma.transaction.create({
          data: {
            type: "INVOICE",
            amount: new Prisma.Decimal(amount),
            cashierId: adminUser!.id,
            organizationId: org.id,
            createdAt,
          },
        });

        await prisma.organization.update({
          where: { slug: org.slug },
          data: { balance: { increment: new Prisma.Decimal(amount) } },
        });
      });
    }

    // create 30 transactions in the last month, 2 each day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      await createTransaction("10", date);
      await createTransaction("20", date);
    }

    const { statistics } = await service.getOrgStatistics(orgData.slug);

    const _30daysEarlier = new Date(today);
    _30daysEarlier.setDate(today.getDate() - 29);
    _30daysEarlier.setHours(0, 0, 0, 0);

    expect(statistics).toBeDefined();
    expect(statistics?.transactionCount).toBe(60);
    expect(statistics?.balance).toBe("900");
    expect(statistics?.balanceAtDate.length).toBe(30);
    expect(statistics?.balanceAtDate[0].date).toEqual(_30daysEarlier);
    expect(statistics?.balanceAtDate[0].balance).toBe("30");
    expect(statistics?.balanceAtDate[14].balance).toBe("450");
    expect(statistics?.balanceAtDate[29].date).toEqual(new Date(today));
    expect(statistics?.balanceAtDate[29].balance).toBe("900");
  });
});
