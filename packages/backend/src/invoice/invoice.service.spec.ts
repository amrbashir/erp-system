import { BadRequestException } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSaleInvoiceDto } from "./invoice.dto";
import { InvoiceService } from "./invoice.service";

describe("InvoiceService", async () => {
  let service: InvoiceService;
  let prisma: PrismaService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaService();
    service = new InvoiceService(prisma);
  });

  afterAll(dropDatabase);

  async function setupTestOrganization() {
    // Create test organization
    const orgData = generateRandomOrgData();
    const org = await prisma.organization.create({
      data: {
        name: orgData.name,
        slug: orgData.slug,
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

    const randomId = Math.random().toString(36).substring(2, 8);

    // Create test products
    const product1 = await prisma.product.create({
      data: {
        barcode: randomId,
        description: "Product 1",
        purchasePrice: 50,
        sellingPrice: 100,
        stockQuantity: 20,
        organization: { connect: { id: org.id } },
      },
    });

    const product2 = await prisma.product.create({
      data: {
        description: "Product 2",
        purchasePrice: 75,
        sellingPrice: 150,
        stockQuantity: 15,
        organization: { connect: { id: org.id } },
      },
    });

    return { org, user, store, customer, product1, product2, orgSlug: org.slug };
  }

  describe("createSale", () => {
    it("should create an invoice with valid data", async () => {
      const { customer, product1, product2, user, orgSlug } = await setupTestOrganization();

      const createInvoiceDto: CreateSaleInvoiceDto = {
        customerId: customer.id,
        items: [
          {
            price: product1.sellingPrice,
            productId: product1.id,
            quantity: 2,
            discountPercent: 0,
            discountAmount: 0,
          },
          {
            price: product1.sellingPrice,
            productId: product2.id,
            quantity: 1,
            discountPercent: 10,
            discountAmount: 5,
          },
        ],
        discountPercent: 5,
        discountAmount: 10,
      };

      const invoice = await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);

      // Verify invoice details
      expect(invoice).toBeDefined();
      expect(invoice.items.length).toBe(2);
      expect(invoice.customer!.id).toBe(customer.id);
      expect(invoice.items[0].barcode).toBe(product1.barcode);

      // Verify product quantities have been updated
      const updatedProduct1 = await prisma.product.findUnique({ where: { id: product1.id } });
      const updatedProduct2 = await prisma.product.findUnique({ where: { id: product2.id } });

      expect(updatedProduct1!.stockQuantity).toBe(18); // 20 - 2
      expect(updatedProduct2!.stockQuantity).toBe(14); // 15 - 1

      // Verify transaction was created
      const transaction = await prisma.transaction.findFirst({
        where: { invoice: { id: invoice.id } },
      });

      expect(transaction).toBeDefined();
      expect(transaction!.amount).toBe(invoice.total);
    });

    it("should throw BadRequestException when creating invoice with no items", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      const createInvoiceDto: CreateSaleInvoiceDto = {
        items: [],
        discountPercent: 0,
        discountAmount: 0,
      };

      await expect(service.createSaleInvoice(orgSlug, createInvoiceDto, user.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when product has insufficient stock", async () => {
      const { product1, user, orgSlug } = await setupTestOrganization();

      const createInvoiceDto: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice,
            productId: product1.id,
            quantity: 25, // More than available stock (20)
            discountPercent: 0,
            discountAmount: 0,
          },
        ],
        discountPercent: 0,
        discountAmount: 0,
      };

      await expect(service.createSaleInvoice(orgSlug, createInvoiceDto, user.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should calculate discounts correctly", async () => {
      const { product1, user, orgSlug } = await setupTestOrganization();

      // Values are in base units (e.g., cents, piasters)
      // Item price: 100 base units, Quantity: 5, Total before discount: 500 base units
      // Item discount: 10% (50 base units) + 25 base units flat = 75 base units discount
      // Item total after discount: 425 base units
      // Invoice discount: 5% (21.25 base units) + 10 base units flat = 31.25 base units
      // Final total: 393.75 base units

      const createInvoiceDto: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice,
            productId: product1.id,
            quantity: 5,
            discountPercent: 10,
            discountAmount: 25,
          },
        ],
        discountPercent: 5,
        discountAmount: 10,
      };

      const invoice = await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);

      // The calculation should match what happens in the service
      expect(invoice.subtotal).toBe(425); // After item discounts (in base units)
      expect(invoice.total).toBe(394); // After invoice discounts (in base units), rounded to nearest base unit
    });

    it("should increase organization balance after sale", async () => {
      const { product1, user, orgSlug } = await setupTestOrganization();

      const createInvoiceDto: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice,
            productId: product1.id,
            quantity: 1,
            discountPercent: 0,
            discountAmount: 0,
          },
        ],
        discountPercent: 0,
        discountAmount: 0,
      };

      await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);
      await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);

      const updatedOrg = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });

      expect(updatedOrg!.balance).toBe(product1.sellingPrice * 2); // 2 invoices created, each with selling price of product1
    });

    it("should get all invoices for an organization", async () => {
      const { product1, user, orgSlug } = await setupTestOrganization();

      // Create multiple invoices
      const createInvoiceDto1: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice,
            productId: product1.id,
            quantity: 1,
            discountPercent: 0,
            discountAmount: 0,
          },
        ],
        discountPercent: 0,
        discountAmount: 0,
      };

      const createInvoiceDto2: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice,
            productId: product1.id,
            quantity: 2,
            discountPercent: 0,
            discountAmount: 0,
          },
        ],
        discountPercent: 0,
        discountAmount: 0,
      };

      await service.createSaleInvoice(orgSlug, createInvoiceDto1, user.id);
      await service.createSaleInvoice(orgSlug, createInvoiceDto2, user.id);

      const invoices = await service.getAllInvoices(orgSlug);

      expect(invoices.length).toBe(2);
      expect(invoices[0].items.length).toBe(1);
      expect(invoices[1].items.length).toBe(1);
    });
  });

  describe("createPurchase", () => {
    it("should create a purchase invoice with valid data", async () => {
      const { customer, user, orgSlug } = await setupTestOrganization();

      const purchaseInvoiceDto = {
        customerId: customer.id,
        items: [
          {
            description: "New Product 1",
            purchasePrice: 40,
            sellingPrice: 80,
            quantity: 10,
            discountPercent: 0,
            discountAmount: 0,
          },
          {
            description: "New Product 2",
            purchasePrice: 60,
            sellingPrice: 120,
            quantity: 5,
            discountPercent: 5,
            discountAmount: 10,
          },
        ],
        discountPercent: 2,
        discountAmount: 5,
      };

      const invoice = await service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);

      // Verify invoice details
      expect(invoice).toBeDefined();
      expect(invoice.type).toBe("PURCHASE");
      expect(invoice.items.length).toBe(2);
      expect(invoice.customer!.id).toBe(customer.id);

      // Verify products were created
      const product1 = await prisma.product.findFirst({
        where: {
          description: "New Product 1",
          organization: { slug: orgSlug },
        },
      });

      const product2 = await prisma.product.findFirst({
        where: {
          description: "New Product 2",
          organization: { slug: orgSlug },
        },
      });

      expect(product1).toBeDefined();
      expect(product1!.stockQuantity).toBe(10);
      expect(product1!.purchasePrice).toBe(40);
      expect(product1!.sellingPrice).toBe(80);

      expect(product2).toBeDefined();
      expect(product2!.stockQuantity).toBe(5);
      expect(product2!.purchasePrice).toBe(60);
      expect(product2!.sellingPrice).toBe(120);

      // Verify transaction was created
      const transaction = await prisma.transaction.findFirst({
        where: { invoice: { id: invoice.id } },
      });

      expect(transaction).toBeDefined();
      expect(transaction!.amount).toBe(-invoice.total); // Amount is negative for purchases
    });

    it("should update existing products when purchasing with the same description", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      // First, create a product
      const existingProduct = await prisma.product.create({
        data: {
          description: "Existing Product",
          purchasePrice: 50,
          sellingPrice: 100,
          stockQuantity: 5,
          organization: { connect: { slug: orgSlug } },
        },
      });

      // Now purchase more of the same product
      const purchaseInvoiceDto = {
        items: [
          {
            description: "Existing Product", // Same description as existing product
            purchasePrice: 45, // Updated purchase price
            sellingPrice: 90, // Updated selling price
            quantity: 8,
            discountPercent: 0,
            discountAmount: 0,
          },
        ],
        discountPercent: 0,
        discountAmount: 0,
      };

      await service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);

      // Check that the product was updated, not created as new
      const products = await prisma.product.findMany({
        where: {
          description: "Existing Product",
          organization: { slug: orgSlug },
        },
      });

      expect(products.length).toBe(1); // Only one product with this description
      expect(products[0].id).toBe(existingProduct.id);
      expect(products[0].stockQuantity).toBe(13); // 5 + 8
      expect(products[0].purchasePrice).toBe(45); // Updated
      expect(products[0].sellingPrice).toBe(90); // Updated
    });

    it("should throw BadRequestException when creating purchase invoice with no items", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      const purchaseInvoiceDto = {
        items: [],
        discountPercent: 0,
        discountAmount: 0,
      };

      await expect(
        service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id),
      ).rejects.toThrow(BadRequestException);
    });

    it("should calculate discounts correctly for purchase invoices", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      // Item price: 50 base units, Quantity: 5, Total before discount: 250 base units
      // Item discount: 10% (25 base units) + 15 base units flat = 40 base units discount
      // Item total after discount: 210 base units
      // Invoice discount: 5% (10.5 base units) + 5 base units flat = 15.5 base units
      // Final total: 195 base units (rounded)

      const purchaseInvoiceDto = {
        items: [
          {
            description: "Discount Test Product",
            purchasePrice: 50,
            sellingPrice: 100,
            quantity: 5,
            discountPercent: 10,
            discountAmount: 15,
          },
        ],
        discountPercent: 5,
        discountAmount: 5,
      };

      const invoice = await service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);

      // The calculation should match what happens in the service
      expect(invoice.subtotal).toBe(210); // After item discounts (in base units)
      expect(invoice.total).toBe(195); // After invoice discounts (in base units), rounded to nearest base unit
    });

    it("should decrease organization balance after purchase", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      // Initial balance should be 0
      const initialOrg = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });
      expect(initialOrg!.balance).toBe(0);

      const purchaseInvoiceDto = {
        items: [
          {
            description: "Balance Test Product",
            purchasePrice: 100,
            sellingPrice: 200,
            quantity: 1,
            discountPercent: 0,
            discountAmount: 0,
          },
        ],
        discountPercent: 0,
        discountAmount: 0,
      };

      await service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);

      // Check balance decreased by purchase amount
      const updatedOrg = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });

      expect(updatedOrg!.balance).toBe(-100); // Decreased by purchase amount
    });
  });
});
