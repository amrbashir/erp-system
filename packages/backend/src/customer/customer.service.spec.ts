import { NotFoundException } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { CreateCustomerDto } from "./customer.dto";
import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { CustomerService } from "./customer.service";

describe("CustomerService", async () => {
  let service: CustomerService;
  let prisma: PrismaService;
  let orgService: OrgService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaService();
    orgService = new OrgService(prisma);
    service = new CustomerService(prisma);
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

    await expect(
      service.updateCustomer(nonExistentCustomerId, { name: "Non Existent" }, org.slug),
    ).rejects.toThrow(NotFoundException);
  });
});
