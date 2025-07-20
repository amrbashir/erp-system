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

  function createTransaction(
    amount: number,
    orgSlug: string,
    cashierId: string,
    customerId?: number,
  ) {
    return prismaService.transaction.create({
      data: {
        amount,
        type: "INVOICE",
        cashier: { connect: { id: cashierId } },
        organization: { connect: { slug: orgSlug } },
        ...(customerId && { customer: { connect: { id: customerId } } }),
      },
    });
  }

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

  it("should return transactions by customer ID", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);
    const adminUser = await userService.findByUsernameInOrg(orgData.username, org.slug);

    const customer = await prismaService.customer.create({
      data: {
        name: "Test Customer",
        organization: { connect: { slug: org.slug } },
      },
    });

    await createTransaction(100, org.slug, adminUser!.id);
    await createTransaction(-200, org.slug, adminUser!.id);

    const transactions = await service.getTransactionsByCustomerId(org.slug, customer.id, {
      orderBy: { createdAt: "asc" },
    });

    expect(transactions).toBeDefined();
    expect(transactions.length).toBe(0); // No transactions linked to the customer yet

    // Create a transaction linked to the customer
    await createTransaction(150, org.slug, adminUser!.id, customer.id);
    await createTransaction(-50, org.slug, adminUser!.id, customer.id);

    const customerTransactions = await service.getTransactionsByCustomerId(org.slug, customer.id, {
      orderBy: { createdAt: "asc" },
    });

    expect(customerTransactions).toBeDefined();
    expect(customerTransactions.length).toBe(2);
    expect(customerTransactions[0].amount.toNumber()).toBe(150);
    expect(customerTransactions[1].amount.toNumber()).toBe(-50);
    expect(customerTransactions[0].cashier.id).toBe(adminUser!.id);
    expect(customerTransactions[1].cashier.id).toBe(adminUser!.id);
    expect(customerTransactions[0].customer?.id).toBe(customer.id);
    expect(customerTransactions[1].customer?.id).toBe(customer.id);
  });
});
