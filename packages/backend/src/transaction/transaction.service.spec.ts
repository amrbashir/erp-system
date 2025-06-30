import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useRandomDatabase } from "../../e2e/utils";
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

  beforeEach(async () => {
    await createDatabase();

    prismaService = new PrismaService();
    service = new TransactionService(prismaService);
    orgService = new OrgService(prismaService);
    userService = new UserService(prismaService);
  });

  afterEach(dropDatabase);

  describe("getAllTransactions", () => {
    it("should create a transaction ", async () => {
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

      const transaction = await service.createTransaction(100, org.slug, adminUser!.id);

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(100);
      expect(transaction.cashierId).toBe(adminUser!.id);
      expect(transaction.organizationId).toBe(org.id);
    });

    it("should return transactions with customer and cashier relations", async () => {
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

      await service.createTransaction(100, org.slug, adminUser!.id);
      await service.createTransaction(-200, org.slug, adminUser!.id);

      const result = await service.getAllTransactions(org.slug);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].amount).toBe(100);
      expect(result[1].amount).toBe(-200);
      expect(result[0].cashier.id).toBe(adminUser!.id);
      expect(result[1].cashier.id).toBe(adminUser!.id);
    });
  });
});
