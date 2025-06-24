import { it, expect, beforeEach, afterEach, describe } from "vitest";
import { CustomerService } from "./customer.service";
import { PrismaService } from "../prisma/prisma.service";
import { OrgService } from "../org/org.service";
import { useRandomDatabase } from "../../e2e/utils";
import type { CreateCustomerDto } from "./customer.dto";

describe("CustomerService", async () => {
  let service: CustomerService;
  let prisma: PrismaService;
  let orgService: OrgService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeEach(async () => {
    await createDatabase();
    prisma = new PrismaService();
    orgService = new OrgService(prisma);
    service = new CustomerService(prisma);
  });

  afterEach(async () => await dropDatabase());

  it("should create a customer", async () => {
    const org = await orgService.create({
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    });

    const createCustomerDto: CreateCustomerDto = {
      name: "Test Customer",
      email: "customer@email.com",
      phone: "1234567890",
    };

    const customer = await service.createCustomer(createCustomerDto, org.slug);
    expect(customer).toBeDefined();
    expect(customer.name).toBe(createCustomerDto.name);
    expect(customer.email).toBe(createCustomerDto.email);
    expect(customer.phone).toBe(createCustomerDto.phone);
    expect(customer.organizationId).toBe(org.id);
  });

  it("should return all customers", async () => {
    const org = await orgService.create({
      name: "Test Org",
      username: "admin",
      password: "12345678",
    });

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
