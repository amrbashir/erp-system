import { slugify } from "@erp-system/utils/slug.ts";
import { expect } from "@std/expect";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import * as argon2 from "argon2";
import { Decimal } from "decimal.js";

import { PrismaClient } from "@/prisma-client.ts";
import { UserRole } from "@/prisma.ts";
import { TransactionService } from "@/transaction/transaction.service.ts";
import { UserService } from "@/user/user.service.ts";

import { generateRandomOrgData, useRandomDatabase } from "../../../utils/src/testing.ts";
import { OrgService } from "./org.service.ts";

describe("OrgService", () => {
  let orgService: OrgService;
  let prisma: PrismaClient;
  let userService: UserService;
  let transactionService: TransactionService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaClient();
    orgService = new OrgService(prisma);
    userService = new UserService(prisma);
    transactionService = new TransactionService(prisma);
  });

  afterAll(dropDatabase);

  it("should create an organization with valid data", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

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

    const result = orgService.create(orgData);
    await expect(result).rejects.toThrow();
  });

  it("should throw ConflictException for existing organization", async () => {
    const orgData = generateRandomOrgData();
    await orgService.create(orgData); // create for the first time

    const result = orgService.create(orgData);
    await expect(result).rejects.toThrow();
  });

  it("should create an organization without slug", async () => {
    const orgData = generateRandomOrgData();
    orgData.slug = undefined as unknown as string; // No slug provided

    const org = await orgService.create(orgData);

    expect(org).toBeDefined();
    expect(org!.name).toBe(orgData.name);
    expect(org!.slug).toBe(slugify(orgData.name));
  });

  it("should get organization if exists", async () => {
    const orgData = generateRandomOrgData();
    await orgService.create(orgData);

    const retrieved = await orgService.findBySlug(orgData.slug);

    expect(retrieved).toMatchObject({
      name: orgData.name,
      slug: orgData.slug,
    });
  });

  it("should create multiple organizations with different slugs", async () => {
    const org1Data = generateRandomOrgData();
    const org1 = await orgService.create(org1Data);

    const org2Data = generateRandomOrgData();
    const org2 = await orgService.create(org2Data);

    expect(org1.slug).toBe(org1Data.slug);
    expect(org2.slug).toBe(org2Data.slug);

    const retrieved1 = await orgService.findBySlug(org1Data.slug);
    const retrieved2 = await orgService.findBySlug(org2Data.slug);

    expect(retrieved1).toBeDefined();
    expect(retrieved2).toBeDefined();
  });

  it("should add balance to an organization", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);
    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    const addBalanceDto = { amount: "100", description: "Initial balance" };
    await orgService.addBalance(org.slug, addBalanceDto, adminUser!.id);

    const updatedOrg = await orgService.findBySlug(org.slug);
    expect(updatedOrg).toBeDefined();
    expect(updatedOrg!.balance.toNumber()).toBe(100);

    const addBalanceDto2 = { amount: "10", description: "Adding balance 2nd time" };
    await orgService.addBalance(org.slug, addBalanceDto2, adminUser!.id);

    const updatedOrg2 = await orgService.findBySlug(org.slug);
    expect(updatedOrg2).toBeDefined();
    expect(updatedOrg2!.balance.toNumber()).toBe(110);

    const transactions = await transactionService.getAll(org.slug, {
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
    const org = await orgService.create(orgData);
    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    function createTransaction(amount: string, createdAt: Date) {
      return prisma.$transaction(async (prisma) => {
        await prisma.transaction.create({
          data: {
            type: "INVOICE",
            amount: new Decimal(amount),
            cashierId: adminUser!.id,
            organizationId: org.id,
            createdAt,
          },
        });

        await prisma.organization.update({
          where: { slug: org.slug },
          data: { balance: { increment: new Decimal(amount) } },
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

    const statistics = await orgService.getStatistics(orgData.slug);

    const _30daysEarlier = new Date(today);
    _30daysEarlier.setDate(today.getDate() - 29);
    _30daysEarlier.setHours(0, 0, 0, 0);

    expect(statistics).toBeDefined();
    expect(statistics?.transactionCount).toBe(60);
    expect(statistics?.balance.toNumber()).toBe(900);
    expect(statistics?.balanceAtDate.length).toBe(30);
    expect(statistics?.balanceAtDate[0].date).toEqual(_30daysEarlier);
    expect(statistics?.balanceAtDate[0].balance.toNumber()).toBe(30);
    expect(statistics?.balanceAtDate[14].balance.toNumber()).toBe(450);
    expect(statistics?.balanceAtDate[29].date).toEqual(new Date(today));
    expect(statistics?.balanceAtDate[29].balance.toNumber()).toBe(900);
  });
});
