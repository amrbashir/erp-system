import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionService } from "../transaction/transaction.service";
import { UserService } from "../user/user.service";
import { InvoiceService } from "./invoice.service";

describe("InvoiceService", () => {
  let service: InvoiceService;
  let prismaService: PrismaService;
  let orgService: OrgService;
  let userService: UserService;
  let transactionService: TransactionService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeEach(async () => {
    await createDatabase();

    prismaService = new PrismaService();
    service = new InvoiceService(prismaService);
    orgService = new OrgService(prismaService);
    userService = new UserService(prismaService);
    transactionService = new TransactionService(prismaService);
  });

  afterEach(dropDatabase);

  describe("getAllInvoices", () => {
    it("should return invoices with customer, and cashier relations", async () => {
      // Create an organization
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

      // Create a transaction first
      const transaction = await transactionService.createTransaction(100, org.slug, adminUser!.id);

      // Create an invoice directly in the database
      const invoice = await prismaService.invoice.create({
        data: {
          total: 100,
          cashier: { connect: { id: adminUser!.id } },
          organization: { connect: { slug: org.slug } },
          transaction: { connect: { id: transaction.id } },
          items: {
            create: [
              {
                description: "Test Item",
                purchase_price: 80,
                selling_price: 100,
                quantity: 1,
              },
            ],
          },
        },
        include: {
          items: true,
          cashier: true,
        },
      });

      // Test the getAllInvoices method
      const result = await service.getAllInvoices(org.slug);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(invoice.id);
      expect(result[0].total).toBe(100);
      expect(result[0].cashier.id).toBe(adminUser!.id);
      expect(result[0].items.length).toBe(1);
      expect(result[0].items[0].description).toBe("Test Item");
    });
  });
});
