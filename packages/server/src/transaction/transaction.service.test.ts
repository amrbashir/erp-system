import { generateRandomOrgData, useRandomDatabase } from "@erp-system/utils/testing.ts";
import { expect } from "@std/expect";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

import { OrgService } from "@/org/org.service.ts";
import { PrismaClient } from "@/prisma/client.ts";
import { UserService } from "@/user/user.service.ts";

import { TransactionService } from "./transaction.service.ts";

describe("TransactionService", () => {
  let transactionService: TransactionService;
  let prisma: PrismaClient;
  let orgService: OrgService;
  let userService: UserService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();

    prisma = new PrismaClient();
    transactionService = new TransactionService(prisma);
    orgService = new OrgService(prisma);
    userService = new UserService(prisma);
  });

  afterAll(dropDatabase);

  function createTransaction(
    amount: number,
    orgSlug: string,
    cashierId: string,
    customerId?: number,
  ) {
    return prisma.transaction.create({
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

    const { data } = await transactionService.getAll(org.slug, { orderBy: { createdAt: "asc" } });

    expect(data).toBeDefined();
    expect(data.length).toBe(2);
    expect(data[0].amount.toNumber()).toBe(100);
    expect(data[1].amount.toNumber()).toBe(-200);
    expect(data[0].cashier.username).toBe(adminUser!.username);
    expect(data[1].cashier.username).toBe(adminUser!.username);
  });

  it("should return transactions by customer ID", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);
    const adminUser = await userService.findByUsernameInOrg(orgData.username, org.slug);

    const customer = await prisma.customer.create({
      data: {
        name: "Test Customer",
        organization: { connect: { slug: org.slug } },
      },
    });

    await createTransaction(100, org.slug, adminUser!.id);
    await createTransaction(-200, org.slug, adminUser!.id);

    const { data: transactions } = await transactionService.getByCustomerId(org.slug, customer.id, {
      orderBy: { createdAt: "asc" },
    });

    expect(transactions).toBeDefined();
    expect(transactions.length).toBe(0); // No transactions linked to the customer yet

    // Create a transaction linked to the customer
    await createTransaction(150, org.slug, adminUser!.id, customer.id);
    await createTransaction(-50, org.slug, adminUser!.id, customer.id);

    const { data: customerTransactions } = await transactionService.getByCustomerId(
      org.slug,
      customer.id,
      {
        orderBy: { createdAt: "asc" },
      },
    );

    expect(customerTransactions).toBeDefined();
    expect(customerTransactions.length).toBe(2);
    expect(customerTransactions[0].amount.toNumber()).toBe(150);
    expect(customerTransactions[1].amount.toNumber()).toBe(-50);
    expect(customerTransactions[0].cashier.username).toBe(adminUser!.username);
    expect(customerTransactions[1].cashier.username).toBe(adminUser!.username);
    expect(customerTransactions[0].customer?.id).toBe(customer.id);
    expect(customerTransactions[1].customer?.id).toBe(customer.id);
  });
});
