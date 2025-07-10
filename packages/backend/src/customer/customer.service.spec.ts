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
});
