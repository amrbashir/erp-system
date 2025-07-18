import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { UserService } from "../user/user.service";
import { TransactionService } from "./transaction.service";

describe("TransactionService", () => {
  let service: TransactionService;
  let prismaService: PrismaService;
  let orgService: OrgService;
  let userService: UserService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();

    prismaService = new PrismaService();
    service = new TransactionService(prismaService);
    orgService = new OrgService(prismaService);
    userService = new UserService(prismaService);
  });

  afterAll(dropDatabase);

  function createTransaction(amount: number, orgSlug: string, cashierId: string) {
    return prismaService.transaction.create({
      data: {
        amount,
        type: "EXPENSE",
        cashier: { connect: { id: cashierId } },
        organization: { connect: { slug: orgSlug } },
      },
    });
  }

  it("should create a transaction ", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);
    const adminUser = await userService.findByUsernameInOrg(orgData.username, org.slug);

    const transaction = await createTransaction(100, org.slug, adminUser!.id);

    expect(transaction).toBeDefined();
    expect(transaction.amount.toNumber()).toBe(100);
    expect(transaction.cashierId).toBe(adminUser!.id);
    expect(transaction.organizationId).toBe(org.id);
  });

  it("should return transactions with customer and cashier relations", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);
    const adminUser = await userService.findByUsernameInOrg(orgData.username, org.slug);

    await createTransaction(100, org.slug, adminUser!.id);
    await createTransaction(-200, org.slug, adminUser!.id);

    const result = await service.getAllTransactions(org.slug, { orderBy: { createdAt: "asc" } });

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0].amount.toNumber()).toBe(100);
    expect(result[1].amount.toNumber()).toBe(-200);
    expect(result[0].cashier.id).toBe(adminUser!.id);
    expect(result[1].cashier.id).toBe(adminUser!.id);
  });
});
