import { expect } from "@std/expect";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

import { InvoiceService } from "@/invoice/invoice.service.ts";
import { OrgService } from "@/org/org.service.ts";
import { PrismaClient } from "@/prisma-client.ts";

import type { CreateCustomerDto } from "./customer.dto.ts";
import { generateRandomOrgData, useRandomDatabase } from "../../../utils/src/testing.ts";
import { CustomerService } from "./customer.service.ts";

describe("CustomerService", () => {
  let customerService: CustomerService;
  let prisma: PrismaClient;
  let orgService: OrgService;
  let invoiceService: InvoiceService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaClient();
    orgService = new OrgService(prisma);
    customerService = new CustomerService(prisma);
    invoiceService = new InvoiceService(prisma);
  });

  afterAll(dropDatabase);

  it("should create a customer", async () => {
    const orgData = generateRandomOrgData();

    const org = await orgService.create(orgData);

    const createCustomerDto: CreateCustomerDto = {
      name: "Test Customer",
      address: "123 Test St",
      phone: "1234567890",
    };

    const customer = await customerService.create(createCustomerDto, org.slug);
    expect(customer).toBeDefined();
    expect(customer.name).toBe(createCustomerDto.name);
    expect(customer.address).toBe(createCustomerDto.address);
    expect(customer.phone).toBe(createCustomerDto.phone);
    expect(customer.organizationId).toBe(org.id);
  });

  it("should return all customers", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const customer1 = await customerService.create({ name: "Customer One" }, org.slug);

    const customer2 = await customerService.create({ name: "Customer Two" }, org.slug);

    const customers = await customerService.getAll(org.slug);
    expect(customers).toBeDefined();
    expect(customers.length).toBeGreaterThanOrEqual(2);
    expect(customers).toContainEqual(expect.objectContaining({ id: customer1.id }));
    expect(customers).toContainEqual(expect.objectContaining({ id: customer2.id }));
    expect(customers[0].organizationId).toBe(org!.id);
    expect(customers[1].organizationId).toBe(org!.id);
  });

  it("should update a customer", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createCustomerDto: CreateCustomerDto = {
      name: "Customer to Update",
      address: "123 Update St",
      phone: "0987654321",
    };

    const customer = await customerService.create(createCustomerDto, org.slug);

    const updateCustomerDto = {
      name: "Updated Customer",
      address: "456 Updated St",
      phone: "1122334455",
    };

    const updatedCustomer = await customerService.update(customer.id, updateCustomerDto, org.slug);
    expect(updatedCustomer).toBeDefined();
    expect(updatedCustomer.name).toBe(updateCustomerDto.name);
    expect(updatedCustomer.address).toBe(updateCustomerDto.address);
    expect(updatedCustomer.phone).toBe(updateCustomerDto.phone);
  });

  it("should only update provided fields", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createCustomerDto: CreateCustomerDto = {
      name: "Partial Update Customer",
      address: "789 Partial St",
      phone: "1231231234",
    };
    const customer = await customerService.create(createCustomerDto, org.slug);

    const updateCustomerDto = {
      name: "Partially Updated Customer",
    };
    const updatedCustomer = await customerService.update(customer.id, updateCustomerDto, org.slug);

    expect(updatedCustomer).toBeDefined();
    expect(updatedCustomer.name).toBe(updateCustomerDto.name);
    expect(updatedCustomer.address).toBe(createCustomerDto.address);
    expect(updatedCustomer.phone).toBe(createCustomerDto.phone);
  });

  it("should throw an error when updating a customer that does not exist", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const nonExistentCustomerId = 9999; // Assuming this ID does not exist

    const result = customerService.update(
      nonExistentCustomerId,
      { name: "Non Existent" },
      org.slug,
    );
    await expect(result).rejects.toThrow();
  });

  it("should find a customer by ID", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createCustomerDto: CreateCustomerDto = {
      name: "Find Customer",
      address: "123 Find St",
      phone: "3213213210",
    };
    const customer = await customerService.create(createCustomerDto, org.slug);

    const foundCustomer = await customerService.findById(customer.id, org.slug);
    expect(foundCustomer).toBeDefined();
    expect(foundCustomer!.id).toBe(customer.id);
    expect(foundCustomer!.name).toBe(createCustomerDto.name);
    expect(foundCustomer!.details).toBeDefined();
    expect(foundCustomer!.details?.balance.toNumber()).toBe(0);

    // Get admin user
    const user = await prisma.user.findFirstOrThrow({
      where: { organizationId: org.id, username: "admin" },
    });

    // create an invoice to test details
    const product = await prisma.product.create({
      data: {
        description: "Test Product",
        sellingPrice: 100,
        purchasePrice: 80,
        stockQuantity: 10,
        organization: { connect: { id: org.id } },
      },
    });
    const invoice = await invoiceService.createSaleInvoice(
      org.slug,
      {
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: product.sellingPrice.toString(),
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "10",
        customerId: customer.id,
      },
      user.id,
    );

    expect(invoice).toBeDefined();
    expect(invoice.customerId).toBe(customer.id);

    const updatedCustomer = await customerService.findById(customer.id, org.slug);
    expect(updatedCustomer).toBeDefined();
    expect(updatedCustomer!.details?.balance.toNumber()).toBe(-90);
  });

  it("should collect/pay money from/to a customer", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createCustomerDto: CreateCustomerDto = {
      name: "Collect Money Customer",
      address: "123 Collect St",
      phone: "4564564567",
    };
    const customer = await customerService.create(createCustomerDto, org.slug);

    const user = await prisma.user.findFirstOrThrow({
      where: { organizationId: org.id, username: "admin" },
    });

    // create a sale invoice so the customer owes us money
    const product = await prisma.product.create({
      data: {
        description: "Test Product",
        sellingPrice: 100,
        purchasePrice: 80,
        stockQuantity: 10,
        organization: { connect: { id: org.id } },
      },
    });

    await invoiceService.createSaleInvoice(
      org.slug,
      {
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: product.sellingPrice.toString(),
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "10",
        customerId: customer.id,
      },
      user.id,
    );

    const updatedCustomer = await customerService.findById(customer.id, org.slug);
    expect(updatedCustomer).toBeDefined();
    expect(updatedCustomer!.details?.balance.toNumber()).toBe(-90);

    // Collect money from customer
    await customerService.collectMoney(customer.id, "50", org.slug, user.id);

    const afterCollectCustomer = await customerService.findById(customer.id, org.slug);
    expect(afterCollectCustomer).toBeDefined();
    expect(afterCollectCustomer!.details?.balance.toNumber()).toBe(-40);

    // create a purchase invoice so the customer is owed money
    await invoiceService.createPurchaseInvoice(
      org.slug,
      {
        items: [
          {
            productId: product.id,
            quantity: 1,
            purchasePrice: product.purchasePrice.toString(),
            sellingPrice: product.sellingPrice.toString(),
            discountPercent: 0,
            discountAmount: "0",
          },
        ],
        discountPercent: 0,
        discountAmount: "0",
        paid: "50",
        customerId: customer.id,
      },
      user.id,
    );

    const afterPurchaseCustomer = await customerService.findById(customer.id, org.slug);
    expect(afterPurchaseCustomer).toBeDefined();
    expect(afterPurchaseCustomer!.details?.balance.toNumber()).toBe(-10);

    // Pay money to customer
    await customerService.payMoney(customer.id, "10", org.slug, user.id);

    const afterPayCustomer = await customerService.findById(customer.id, org.slug);
    expect(afterPayCustomer).toBeDefined();
    expect(afterPayCustomer!.details?.balance.toNumber()).toBe(0);
  });
});
