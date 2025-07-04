import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionService } from "../transaction/transaction.service";
import { UserService } from "../user/user.service";
import { CreateInvoiceDto, CreateInvoiceItemDto } from "./invoice.dto";
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

  function createTransaction(amount: number, orgSlug: string, cashierId: string) {
    return prismaService.transaction.create({
      data: {
        amount,
        cashier: { connect: { id: cashierId } },
        organization: { connect: { slug: orgSlug } },
      },
    });
  }

  it("should create an invoice with items and update product stock", async () => {
    // Create an organization
    const org = await orgService.create({
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    });

    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    // Create a customer
    const customer = await prismaService.customer.create({
      data: {
        name: "Test Customer",
        email: "customer@test.com",
        phone: "1234567890",
        organization: { connect: { slug: org.slug } },
      },
    });

    // Create test products
    const product1 = await prismaService.product.create({
      data: {
        description: "Test Product 1",
        purchase_price: 80,
        selling_price: 100,
        stock_quantity: 10,
        organization: { connect: { slug: org.slug } },
      },
    });

    const product2 = await prismaService.product.create({
      data: {
        description: "Test Product 2",
        purchase_price: 150,
        selling_price: 200,
        stock_quantity: 5,
        organization: { connect: { slug: org.slug } },
      },
    });

    // Create invoice DTO
    const createInvoiceDto: CreateInvoiceDto = {
      customerId: customer.id,
      items: [
        { productId: product1.id, quantity: 2 } as CreateInvoiceItemDto,
        { productId: product2.id, quantity: 1 } as CreateInvoiceItemDto,
      ],
    };

    // Call service method
    const result = await service.createInvoice(org.slug, createInvoiceDto, adminUser!.id);

    // Verify invoice was created correctly
    expect(result).toBeDefined();
    expect(result.customerId).toBe(customer.id);
    expect(result.cashierId).toBe(adminUser!.id);
    expect(result.total).toBe(400); // (2 * 100) + (1 * 200) = 400
    expect(result.items.length).toBe(2);

    // Verify items
    const item1 = result.items.find((item) => item.description === "Test Product 1");
    const item2 = result.items.find((item) => item.description === "Test Product 2");

    expect(item1).toBeDefined();
    expect(item1!.quantity).toBe(2);
    expect(item1!.selling_price).toBe(100);
    expect(item1!.purchase_price).toBe(80);

    expect(item2).toBeDefined();
    expect(item2!.quantity).toBe(1);
    expect(item2!.selling_price).toBe(200);
    expect(item2!.purchase_price).toBe(150);

    // Verify transaction was created
    const transaction = await prismaService.transaction.findUnique({
      where: { id: result.transactionId },
    });
    expect(transaction).toBeDefined();
    expect(transaction!.amount).toBe(400);
    expect(transaction!.cashierId).toBe(adminUser!.id);
    expect(transaction!.customerId).toBe(customer.id);

    // Verify product stock was updated
    const updatedProduct1 = await prismaService.product.findUnique({
      where: { id: product1.id },
    });
    const updatedProduct2 = await prismaService.product.findUnique({
      where: { id: product2.id },
    });

    expect(updatedProduct1!.stock_quantity).toBe(8); // 10 - 2 = 8
    expect(updatedProduct2!.stock_quantity).toBe(4); // 5 - 1 = 4
  });

  it("should throw BadRequestException when product has insufficient stock", async () => {
    // Create an organization
    const org = await orgService.create({
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    });

    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    // Create test product with low stock
    const product = await prismaService.product.create({
      data: {
        description: "Low Stock Product",
        purchase_price: 80,
        selling_price: 100,
        stock_quantity: 2,
        organization: { connect: { slug: org.slug } },
      },
    });

    // Create invoice DTO with quantity higher than stock
    const createInvoiceDto: CreateInvoiceDto = {
      items: [{ productId: product.id, quantity: 5 } as CreateInvoiceItemDto],
    };

    // Expect the service to throw BadRequestException
    await expect(service.createInvoice(org.slug, createInvoiceDto, adminUser!.id)).rejects.toThrow(
      /Insufficient stock/,
    );

    // Verify stock wasn't changed
    const updatedProduct = await prismaService.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct!.stock_quantity).toBe(2); // Stock should remain unchanged
  });

  it("should throw BadRequestException when product does not exist", async () => {
    // Create an organization
    const org = await orgService.create({
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    });

    const adminUser = await userService.findByUsernameInOrg("admin", org.slug);

    // Create invoice DTO with non-existent product ID
    const createInvoiceDto: CreateInvoiceDto = {
      items: [{ productId: "non-existent-id", quantity: 1 } as CreateInvoiceItemDto],
    };

    // Expect the service to throw BadRequestException
    await expect(service.createInvoice(org.slug, createInvoiceDto, adminUser!.id)).rejects.toThrow(
      /Product with id/,
    );
  });

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
    const transaction = await createTransaction(100, org.slug, adminUser!.id);

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
