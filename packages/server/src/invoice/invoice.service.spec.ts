import { generateRandomOrgData, useRandomDatabase } from "@erp-system/utils/test.ts";
import { expect } from "@std/expect";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { Decimal } from "decimal.js";

import { PrismaClient } from "@/prisma-client.ts";

import type { CreatePurchaseInvoiceDto, CreateSaleInvoiceDto } from "./invoice.dto.ts";
import { InvoiceService } from "./invoice.service.ts";

describe("InvoiceService", () => {
  let service: InvoiceService;
  let prisma: PrismaClient;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaClient();
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
        purchasePrice: new Decimal("50"),
        sellingPrice: new Decimal("100"),
        stockQuantity: 20,
        organization: { connect: { id: org.id } },
      },
    });

    const product2 = await prisma.product.create({
      data: {
        description: "Product 2",
        purchasePrice: new Decimal("75"),
        sellingPrice: new Decimal("150"),
        stockQuantity: 15,
        organization: { connect: { id: org.id } },
      },
    });

    return { org, user, customer, product1, product2, orgSlug: org.slug };
  }

  describe("createSale", () => {
    it("should create an invoice with valid data", async () => {
      const { customer, product1, product2, user, orgSlug } = await setupTestOrganization();

      const createInvoiceDto: CreateSaleInvoiceDto = {
        customerId: customer.id,
        items: [
          {
            price: product1.sellingPrice.toString(),
            productId: product1.id,
            quantity: 2,
            discountPercent: 0,
            discountAmount: "0",
          },
          {
            price: product1.sellingPrice.toString(),
            productId: product2.id,
            quantity: 1,
            discountPercent: 10,
            discountAmount: "5",
          },
        ],
        discountPercent: 5,
        discountAmount: "10",
        paid: "200",
      };

      const invoice = await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);

      // Verify invoice details
      expect(invoice).toBeDefined();
      expect(invoice.items.length).toBe(2);
      expect(invoice.customer!.id).toBe(customer.id);
      expect(invoice.items[0].barcode).toBe(product1.barcode);
      expect(invoice.subtotal.toNumber()).toBe(285); // 2 * 100 + (1 * 100 - 10% - 5 flat discount)
      expect(invoice.total.toNumber()).toBe(260.75); // 285 - 5% - 10 (invoice discount)
      expect(invoice.paid.toNumber()).toBe(200);
      expect(invoice.remaining.toNumber()).toBe(60.75); // 260.75 - 200

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
      // Use toStrictEqual for comparing Decimal objects
      expect(transaction!.amount).toStrictEqual(new Decimal(createInvoiceDto.paid));
    });

    it("should throw BadRequestException when creating invoice with no items", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      const createInvoiceDto: CreateSaleInvoiceDto = {
        items: [],
        discountPercent: 0,
        discountAmount: "0",
        paid: "0",
      };

      const result = service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);
      await expect(result).rejects.toThrow();
    });

    it("should throw BadRequestException when product has insufficient stock", async () => {
      const { product1, user, orgSlug } = await setupTestOrganization();

      const createInvoiceDto: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice.toString(),
            productId: product1.id,
            quantity: 25, // More than available stock (20)
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "0",
      };

      const result = service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);
      await expect(result).rejects.toThrow();

      // Verify stock remains unchanged
      const updatedProduct = await prisma.product.findUnique({ where: { id: product1.id } });
      expect(updatedProduct!.stockQuantity).toBe(20); // Should still be 20
    });

    it("should throw NotFoundException when non existent data is provided", async () => {
      const { user, orgSlug } = await setupTestOrganization();
      const nonExistentProductId = "non-existent-id";
      const createInvoiceDto: CreateSaleInvoiceDto = {
        items: [
          {
            price: "100",
            productId: nonExistentProductId,
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "0",
      };

      // invalid product ID
      const resultWithInvalidProduct = service.createSaleInvoice(
        orgSlug,
        createInvoiceDto,
        user.id,
      );
      await expect(resultWithInvalidProduct).rejects.toThrow();

      // invalid user ID
      const resultWithInvalidUser = service.createSaleInvoice(
        orgSlug,
        createInvoiceDto,
        "invalid-user-id",
      );
      await expect(resultWithInvalidUser).rejects.toThrow();

      // invalid organization slug
      const invalidOrgSlug = "invalid-org-slug";
      const resultWithInvalidOrg = service.createSaleInvoice(
        invalidOrgSlug,
        createInvoiceDto,
        user.id,
      );
      await expect(resultWithInvalidOrg).rejects.toThrow();

      // invalid customer ID
      createInvoiceDto.customerId = 123123; // Non-existent customer ID
      const resultWithInvalidCustomer = service.createSaleInvoice(
        orgSlug,
        createInvoiceDto,
        user.id,
      );
      await expect(resultWithInvalidCustomer).rejects.toThrow();
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
            price: product1.sellingPrice.toString(),
            productId: product1.id,
            quantity: 5,
            discountPercent: 10,
            discountAmount: "25",
          },
        ],
        discountPercent: 5,
        discountAmount: "10",
        paid: "393.75",
      };

      const invoice = await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);

      // The calculation should match what happens in the service
      expect(invoice.subtotal.toNumber()).toBe(425); // After item discounts (in base units)
      expect(invoice.total.toNumber()).toBe(393.75); // After invoice discounts (in base units), rounded to nearest base unit
    });

    it("should increase organization balance after sale", async () => {
      const { product1, user, orgSlug } = await setupTestOrganization();

      const createInvoiceDto: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice.toString(),
            productId: product1.id,
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: product1.sellingPrice.toString(),
      };

      await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);
      await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);

      const updatedOrg = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });

      // Convert to number for comparison since sellingPrice is a Decimal
      const expectedBalance = new Decimal(product1.sellingPrice).mul(2);
      // Use toStrictEqual for comparing Decimal objects
      expect(updatedOrg!.balance).toStrictEqual(expectedBalance); // 2 invoices created, each with selling price of product1
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
            purchasePrice: "40",
            sellingPrice: "80",
            quantity: 10,
            discountPercent: 0,
            discountAmount: "0",
          },
          {
            description: "New Product 2",
            purchasePrice: "60",
            sellingPrice: "120",
            quantity: 5,
            discountPercent: 5,
            discountAmount: "10",
          },
        ],
        discountPercent: 2,
        discountAmount: "5",
        paid: "500",
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
      expect(product1!.purchasePrice.toNumber()).toBe(40);
      expect(product1!.sellingPrice.toNumber()).toBe(80);

      expect(product2).toBeDefined();
      expect(product2!.stockQuantity).toBe(5);
      expect(product2!.purchasePrice.toNumber()).toBe(60);
      expect(product2!.sellingPrice.toNumber()).toBe(120);

      // Verify transaction was created
      const transaction = await prisma.transaction.findFirst({
        where: { invoice: { id: invoice.id } },
      });

      expect(transaction).toBeDefined();
      // Use toStrictEqual for comparing Decimal objects with negative values
      const expectedAmount = new Decimal(purchaseInvoiceDto.paid).negated();
      expect(transaction!.amount).toStrictEqual(expectedAmount);
    });

    it("should throw BadRequestException when creating purchase invoice with no items", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      const purchaseInvoiceDto = {
        items: [],
        discountPercent: 0,
        discountAmount: "0",
        paid: "0",
      };

      const result = service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);
      await expect(result).rejects.toThrow();
    });

    it("should throw NotFoundException when non existent data is provided", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      const nonExistentProductId = "non-existent-id";
      const purchaseInvoiceDto: CreatePurchaseInvoiceDto = {
        items: [
          {
            productId: nonExistentProductId,
            purchasePrice: "100",
            sellingPrice: "200",
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "100",
      };

      // invalid product ID
      const resultWithInvalidProduct = service.createPurchaseInvoice(
        orgSlug,
        purchaseInvoiceDto,
        user.id,
      );
      await expect(resultWithInvalidProduct).rejects.toThrow();

      // invalid user ID
      const resultWithInvalidUser = service.createPurchaseInvoice(
        orgSlug,
        purchaseInvoiceDto,
        "invalid-user-id",
      );
      await expect(resultWithInvalidUser).rejects.toThrow();

      // invalid organization slug
      const invalidOrgSlug = "invalid-org-slug";
      const resultWithInvalidOrg = service.createPurchaseInvoice(
        invalidOrgSlug,
        purchaseInvoiceDto,
        user.id,
      );
      await expect(resultWithInvalidOrg).rejects.toThrow();

      // invalid customer ID
      purchaseInvoiceDto.customerId = 123123; // Non-existent customer ID
      const resultWithInvalidCustomer = service.createPurchaseInvoice(
        orgSlug,
        purchaseInvoiceDto,
        user.id,
      );
      await expect(resultWithInvalidCustomer).rejects.toThrow();
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
            purchasePrice: "50",
            sellingPrice: "100",
            quantity: 5,
            discountPercent: 10,
            discountAmount: "15",
          },
        ],
        discountPercent: 5,
        discountAmount: "5",
        paid: "194.5",
      };

      const invoice = await service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);

      // The calculation should match what happens in the service
      expect(invoice.subtotal.toNumber()).toBe(210); // After item discounts (in base units)
      expect(invoice.total.toNumber()).toBe(194.5); // After invoice discounts (in base units), rounded to nearest base unit
    });

    it("should decrease organization balance after purchase", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      // Initial balance should be 0
      const initialOrg = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });
      expect(initialOrg!.balance).toStrictEqual(new Decimal(0));

      const purchaseInvoiceDto = {
        items: [
          {
            description: "Balance Test Product",
            purchasePrice: "100",
            sellingPrice: "200",
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "100",
      };

      await service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);

      // Check balance decreased by purchase amount
      const updatedOrg = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });

      expect(updatedOrg!.balance).toStrictEqual(new Decimal(-100)); // Decreased by purchase amount
    });

    it("should create invoice with existing product id", async () => {
      const { user, orgSlug } = await setupTestOrganization();

      // Create a product
      const existingProduct = await prisma.product.create({
        data: {
          barcode: "123456",
          description: "Existing Product",
          purchasePrice: new Decimal("50"),
          sellingPrice: new Decimal("100"),
          stockQuantity: 10,
          organization: { connect: { slug: orgSlug } },
        },
      });

      const purchaseInvoiceDto = {
        items: [
          {
            productId: existingProduct.id, // Use existing product ID
            description: "Balance Test Product", // should be ignored
            barcode: "979", // should be ignored
            purchasePrice: "100",
            sellingPrice: "200",
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "100",
      };

      const invoice = await service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);

      expect(invoice).toBeDefined();
      expect(invoice.items.length).toBe(1);

      expect(invoice.items[0].description).toBe(existingProduct.description); // should use existing product description
      expect(invoice.items[0].barcode).toBe(existingProduct.barcode); // should use existing product barcode

      expect(invoice.items[0].purchasePrice.toString()).toBe("100");
      expect(invoice.items[0].sellingPrice.toString()).toBe("200");
      expect(invoice.items[0].quantity).toBe(1);
      expect(invoice.items[0].discountPercent).toBe(0);
      expect(invoice.items[0].discountAmount.toString()).toBe("0");
    });

    it("should throw BadRequestException when creating invoice without description", async () => {
      const { user, orgSlug } = await setupTestOrganization();
      const purchaseInvoiceDto = {
        items: [
          {
            purchasePrice: "100",
            sellingPrice: "200",
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "100",
      };

      const result = service.createPurchaseInvoice(orgSlug, purchaseInvoiceDto, user.id);
      await expect(result).rejects.toThrow();
    });
  });

  describe("getInvoices", () => {
    it("should get all invoices for an organization", async () => {
      const { product1, product2, user, orgSlug } = await setupTestOrganization();

      // Create multiple invoices
      const createInvoiceDto1: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice.toString(),
            productId: product1.id,
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
          {
            price: product2.sellingPrice.toString(),
            productId: product2.id,
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: product1.sellingPrice.toString(),
      };

      const createInvoiceDto2: CreateSaleInvoiceDto = {
        items: [
          {
            price: product1.sellingPrice.toString(),
            productId: product1.id,
            quantity: 2,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: product1.sellingPrice.mul(2).toString(),
      };

      await service.createSaleInvoice(orgSlug, createInvoiceDto1, user.id);
      await service.createSaleInvoice(orgSlug, createInvoiceDto2, user.id);

      const invoices = await service.getAllInvoices(orgSlug);

      expect(invoices.length).toBe(2);
      expect(invoices[0].items.length).toBe(2);
      expect(invoices[1].items.length).toBe(1);
    });

    it("should get all invoices by customer ID", async () => {
      const { customer, user, orgSlug, product1 } = await setupTestOrganization();
      const createInvoiceDto: CreateSaleInvoiceDto = {
        customerId: customer.id,
        items: [
          {
            price: "100",
            productId: product1.id,
            quantity: 1,
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "100",
      };

      await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);
      await service.createSaleInvoice(orgSlug, createInvoiceDto, user.id);

      const invoices = await service.findByCustomerId(orgSlug, customer.id, {
        orderBy: { createdAt: "asc" },
      });

      expect(invoices).toBeDefined();
      expect(invoices.length).toBe(2);
      expect(invoices[0].customer!.id).toBe(customer.id);
      expect(invoices[1].customer!.id).toBe(customer.id);
    });
  });
});
