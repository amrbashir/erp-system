import { NotFoundException } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { CollectMoneyDto, CreateCustomerDto } from "./customer.dto";
import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { InvoiceService } from "../invoice/invoice.service";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { CustomerService } from "./customer.service";

describe("CustomerService", async () => {
  let service: CustomerService;
  let prisma: PrismaService;
  let orgService: OrgService;
  let invoiceService: InvoiceService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaService();
    orgService = new OrgService(prisma);
    service = new CustomerService(prisma);
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

    const customer = await service.createCustomer(createCustomerDto, org.slug);
    expect(customer).toBeDefined();
    expect(customer.name).toBe(createCustomerDto.name);
    expect(customer.address).toBe(createCustomerDto.address);
    expect(customer.phone).toBe(createCustomerDto.phone);
    expect(customer.organizationId).toBe(org.id);
  });

  it("should return all customers", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const customer1 = await service.createCustomer({ name: "Customer One" }, org.slug);

    const customer2 = await service.createCustomer({ name: "Customer Two" }, org.slug);

    const customers = await service.getAllCustomers(org.slug);
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

    const customer = await service.createCustomer(createCustomerDto, org.slug);

    const updateCustomerDto = {
      name: "Updated Customer",
      address: "456 Updated St",
      phone: "1122334455",
    };

    const updatedCustomer = await service.updateCustomer(customer.id, updateCustomerDto, org.slug);
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
    const customer = await service.createCustomer(createCustomerDto, org.slug);

    const updateCustomerDto = {
      name: "Partially Updated Customer",
    };
    const updatedCustomer = await service.updateCustomer(customer.id, updateCustomerDto, org.slug);

    expect(updatedCustomer).toBeDefined();
    expect(updatedCustomer.name).toBe(updateCustomerDto.name);
    expect(updatedCustomer.address).toBe(createCustomerDto.address);
    expect(updatedCustomer.phone).toBe(createCustomerDto.phone);
  });

  it("should throw an error when updating a customer that does not exist", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const nonExistentCustomerId = 9999; // Assuming this ID does not exist

    const result = service.updateCustomer(
      nonExistentCustomerId,
      { name: "Non Existent" },
      org.slug,
    );
    await expect(result).rejects.toThrow(NotFoundException);
  });

  it("should find a customer by ID", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createCustomerDto: CreateCustomerDto = {
      name: "Find Customer",
      address: "123 Find St",
      phone: "3213213210",
    };
    const customer = await service.createCustomer(createCustomerDto, org.slug);

    const foundCustomer = await service.findCustomerById(customer.id, org.slug);
    expect(foundCustomer).toBeDefined();
    expect(foundCustomer!.id).toBe(customer.id);
    expect(foundCustomer!.name).toBe(createCustomerDto.name);
    expect(foundCustomer!.details).toBeDefined();
    expect(foundCustomer!.details?.balance).toBe("0");

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

    const updatedCustomer = await service.findCustomerById(customer.id, org.slug);
    expect(updatedCustomer).toBeDefined();
    expect(updatedCustomer!.details?.balance).toBe("-90");
  });

  it("should collect/pay money from/to a customer", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createCustomerDto: CreateCustomerDto = {
      name: "Collect Money Customer",
      address: "123 Collect St",
      phone: "4564564567",
    };
    const customer = await service.createCustomer(createCustomerDto, org.slug);

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

    const updatedCustomer = await service.findCustomerById(customer.id, org.slug);
    expect(updatedCustomer).toBeDefined();
    expect(updatedCustomer!.details?.balance).toBe("-90");

    // Collect money from customer
    const collectDto: CollectMoneyDto = {
      amount: "50",
    };
    await service.collectMoney(customer.id, collectDto, org.slug, user.id);

    const afterCollectCustomer = await service.findCustomerById(customer.id, org.slug);
    expect(afterCollectCustomer).toBeDefined();
    expect(afterCollectCustomer!.details?.balance).toBe("-40");

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

    const afterPurchaseCustomer = await service.findCustomerById(customer.id, org.slug);
    expect(afterPurchaseCustomer).toBeDefined();
    expect(afterPurchaseCustomer!.details?.balance).toBe("-10");
  });
});
