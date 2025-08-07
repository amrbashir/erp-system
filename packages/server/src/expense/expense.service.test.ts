import { expect } from "@std/expect";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

import { OrgService } from "@/org/org.service.ts";
import { PrismaClient } from "@/prisma-client.ts";
import { UserService } from "@/user/user.service.ts";

import { generateRandomOrgData, useRandomDatabase } from "../../../utils/src/testing.ts";
import { ExpenseService } from "./expense.service.ts";

describe("ExpenseService", () => {
  let expenseService: ExpenseService;
  let prisma: PrismaClient;
  let orgService: OrgService;
  let userService: UserService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();

    prisma = new PrismaClient();
    expenseService = new ExpenseService(prisma);
    orgService = new OrgService(prisma);
    userService = new UserService(prisma);
  });

  afterAll(dropDatabase);

  it("should create an expense with valid data", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);
    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    const createExpenseDto = {
      description: "Test Expense",
      amount: "100",
    };
    const expense = await expenseService.create(org.slug, createExpenseDto, adminUser!.id);

    expect(expense).toBeDefined();
    expect(expense.description).toBe(createExpenseDto.description);
    expect(expense.amount.toNumber()).toBe(100);
    expect(expense.cashier.id).toBe(adminUser!.id);
    expect(expense.transactionId).toBeDefined();
  });

  it("should return expenses with cashier relation", async () => {
    // Create an organization
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);
    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    const expense = await expenseService.create(
      org.slug,
      {
        description: "Test Expense",
        amount: "100",
      },
      adminUser!.id,
    );

    // Test the getAllExpenses method
    const result = await expenseService.getAll(org.slug);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(expense.id);
    expect(result[0].description).toBe("Test Expense");
    expect(result[0].amount.toNumber()).toBe(100);
    expect(result[0].cashier.id).toBe(adminUser!.id);
    expect(result[0].transactionId).toBeDefined();

    const transaction = await prisma.transaction.findUnique({
      where: { id: result[0].transactionId },
    });

    expect(transaction).toBeDefined();
    expect(transaction!.amount.toNumber()).toBe(-100);
    expect(transaction!.cashierId).toBe(adminUser!.id);
    expect(transaction!.organizationId).toBe(org.id);
  });
});
