import { BadRequestException, NotFoundException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useRandomDatabase } from "../../e2e/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto } from "./invoice.dto";
import { InvoiceService } from "./invoice.service";

describe("InvoiceService", async () => {
  let service: InvoiceService;
  let prisma: PrismaService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeEach(async () => {
    await createDatabase();
    prisma = new PrismaService();
    service = new InvoiceService(prisma);
  });

  afterEach(dropDatabase);

  // Test data
  const orgSlug = "test-org";

  async function setupTestOrganization() {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: "Test Organization",
        slug: orgSlug,
      },
    });

    // Create test user (cashier)
    const user = await prisma.user.create({
      data: {
        username: "testcashier",
        password: "password123",
        role: "USER", // Using UserRole.USER as a default role
        organization: { connect: { id: org.id } },
      },
    });

    // Create test store
    const store = await prisma.store.create({
      data: {
        name: "Test Store",
        slug: "test-store",
        organization: { connect: { id: org.id } },
      },
    });

    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        name: "Test Customer",
        phone: "1234567890",
        organization: { connect: { id: org.id } },
      },
    });

    // Create test products
    const product1 = await prisma.product.create({
      data: {
        description: "Product 1",
        purchase_price: 50,
        selling_price: 100,
        stock_quantity: 20,
        organization: { connect: { id: org.id } },
      },
    });

    const product2 = await prisma.product.create({
      data: {
        description: "Product 2",
        purchase_price: 75,
        selling_price: 150,
        stock_quantity: 15,
        organization: { connect: { id: org.id } },
      },
    });

    return { org, user, store, customer, product1, product2 };
  }

  it("should create an invoice with valid data", async () => {
    const { customer, product1, product2, user } = await setupTestOrganization();

    const createInvoiceDto: CreateInvoiceDto = {
      customerId: Number(customer.id),
      items: [
        {
          productId: product1.id,
          quantity: 2,
          discount_percent: 0,
          discount_amount: 0,
        },
        {
          productId: product2.id,
          quantity: 1,
          discount_percent: 10,
          discount_amount: 5,
        },
      ],
      discount_percent: 5,
      discount_amount: 10,
    };

    const invoice = await service.createInvoice(orgSlug, createInvoiceDto, user.id);

    // Verify invoice details
    expect(invoice).toBeDefined();
    expect(invoice.items.length).toBe(2);
    expect(invoice.customer!.id).toBe(customer.id);

    // Verify product quantities have been updated
    const updatedProduct1 = await prisma.product.findUnique({ where: { id: product1.id } });
    const updatedProduct2 = await prisma.product.findUnique({ where: { id: product2.id } });

    expect(updatedProduct1!.stock_quantity).toBe(18); // 20 - 2
    expect(updatedProduct2!.stock_quantity).toBe(14); // 15 - 1

    // Verify transaction was created
    const transaction = await prisma.transaction.findFirst({
      where: { invoice: { id: invoice.id } },
    });

    expect(transaction).toBeDefined();
    expect(transaction!.amount).toBe(invoice.total);
  });

  it("should throw BadRequestException when creating invoice with no items", async () => {
    const { user } = await setupTestOrganization();

    const createInvoiceDto: CreateInvoiceDto = {
      items: [],
      discount_percent: 0,
      discount_amount: 0,
    };

    await expect(service.createInvoice(orgSlug, createInvoiceDto, user.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException when product has insufficient stock", async () => {
    const { product1, user } = await setupTestOrganization();

    const createInvoiceDto: CreateInvoiceDto = {
      items: [
        {
          productId: product1.id,
          quantity: 25, // More than available stock (20)
          discount_percent: 0,
          discount_amount: 0,
        },
      ],
      discount_percent: 0,
      discount_amount: 0,
    };

    await expect(service.createInvoice(orgSlug, createInvoiceDto, user.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should calculate discounts correctly", async () => {
    const { product1, user } = await setupTestOrganization();

    // Values are in base units (e.g., cents, piasters)
    // Item price: 100 base units, Quantity: 5, Total before discount: 500 base units
    // Item discount: 10% (50 base units) + 25 base units flat = 75 base units discount
    // Item total after discount: 425 base units
    // Invoice discount: 5% (21.25 base units) + 10 base units flat = 31.25 base units
    // Final total: 393.75 base units

    const createInvoiceDto: CreateInvoiceDto = {
      items: [
        {
          productId: product1.id,
          quantity: 5,
          discount_percent: 10,
          discount_amount: 25,
        },
      ],
      discount_percent: 5,
      discount_amount: 10,
    };

    const invoice = await service.createInvoice(orgSlug, createInvoiceDto, user.id);

    // The calculation should match what happens in the service
    expect(invoice.subtotal).toBe(425); // After item discounts (in base units)
    expect(invoice.total).toBe(394); // After invoice discounts (in base units), rounded to nearest base unit
  });

  it("should get all invoices for an organization", async () => {
    const { product1, user } = await setupTestOrganization();

    // Create multiple invoices
    const createInvoiceDto1: CreateInvoiceDto = {
      items: [
        {
          productId: product1.id,
          quantity: 1,
          discount_percent: 0,
          discount_amount: 0,
        },
      ],
      discount_percent: 0,
      discount_amount: 0,
    };

    const createInvoiceDto2: CreateInvoiceDto = {
      items: [
        {
          productId: product1.id,
          quantity: 2,
          discount_percent: 0,
          discount_amount: 0,
        },
      ],
      discount_percent: 0,
      discount_amount: 0,
    };

    await service.createInvoice(orgSlug, createInvoiceDto1, user.id);
    await service.createInvoice(orgSlug, createInvoiceDto2, user.id);

    const invoices = await service.getAllInvoices(orgSlug);

    expect(invoices.length).toBe(2);
    expect(invoices[0].items.length).toBe(1);
    expect(invoices[1].items.length).toBe(1);
  });
});
