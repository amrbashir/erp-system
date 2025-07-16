import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionService } from "../transaction/transaction.service";
import { UserService } from "../user/user.service";
import { ExpenseService } from "./expense.service";

describe("ExpenseService", () => {
  let service: ExpenseService;
  let prismaService: PrismaService;
  let orgService: OrgService;
  let userService: UserService;
  let transactionService: TransactionService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();

    prismaService = new PrismaService();
    service = new ExpenseService(prismaService);
    orgService = new OrgService(prismaService);
    userService = new UserService(prismaService);
    transactionService = new TransactionService(prismaService);
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
    const expense = await service.createExpense(org.slug, createExpenseDto, adminUser!.id);

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

    const expense = await service.createExpense(
      org.slug,
      {
        description: "Test Expense",
        amount: "100",
      },
      adminUser!.id,
    );

    // Test the getAllExpenses method
    const result = await service.getAllExpenses(org.slug);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(expense.id);
    expect(result[0].description).toBe("Test Expense");
    expect(result[0].amount.toNumber()).toBe(100);
    expect(result[0].cashier.id).toBe(adminUser!.id);
    expect(result[0].transactionId).toBeDefined();

    const transaction = await prismaService.transaction.findUnique({
      where: { id: result[0].transactionId },
    });

    expect(transaction).toBeDefined();
    expect(transaction!.amount.toNumber()).toBe(-100);
    expect(transaction!.cashierId).toBe(adminUser!.id);
    expect(transaction!.organizationId).toBe(org.id);
  });
});
