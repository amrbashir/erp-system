import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useRandomDatabase } from "../../e2e/utils";
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

  beforeEach(async () => {
    await createDatabase();

    prismaService = new PrismaService();
    service = new ExpenseService(prismaService);
    orgService = new OrgService(prismaService);
    userService = new UserService(prismaService);
    transactionService = new TransactionService(prismaService);
  });

  afterEach(dropDatabase);

  function createTransaction(amount: number, orgSlug: string, cashierId: string) {
    return prismaService.transaction.create({
      data: {
        amount,
        cashier: { connect: { id: cashierId } },
        organization: { connect: { slug: orgSlug } },
      },
    });
  }

  describe("getAllExpenses", () => {
    it("should return expenses with cashier relation", async () => {
      // Create an organization
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

      // Create a transaction first (expense needs a transaction)
      const transaction = await createTransaction(-100, org.slug, adminUser!.id);

      // Create an expense directly in the database
      const expense = await prismaService.expense.create({
        data: {
          description: "Test Expense",
          price: 100,
          cashier: { connect: { id: adminUser!.id } },
          organization: { connect: { slug: org.slug } },
          transaction: { connect: { id: transaction.id } },
        },
        include: {
          cashier: true,
        },
      });

      // Test the getAllExpenses method
      const result = await service.getAllExpenses(org.slug);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(expense.id);
      expect(result[0].description).toBe("Test Expense");
      expect(result[0].price).toBe(100);
      expect(result[0].cashier.id).toBe(adminUser!.id);
      expect(result[0].transactionId).toBe(transaction.id);
    });
  });
});
