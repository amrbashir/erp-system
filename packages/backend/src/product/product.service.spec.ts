import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CreateProductDto } from "./product.dto";
import { useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProductService } from "./product.service";

describe("ProductService", async () => {
  let service: ProductService;
  let prisma: PrismaService;
  let orgService: OrgService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeEach(async () => {
    await createDatabase();
    prisma = new PrismaService();
    orgService = new OrgService(prisma);
    service = new ProductService(prisma);
  });

  afterEach(async () => await dropDatabase());

  it("should create a product", async () => {
    const org = await orgService.create({
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    });

    const createCustomerDto: CreateProductDto = {
      name: "Test Customer",
      email: "customer@email.com",
      phone: "1234567890",
    };

    const customer = await service.createProduct(createCustomerDto, org.slug);
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

    const customer1 = await service.createProduct({ name: "Customer One" }, org.slug);

    const customer2 = await service.createProduct({ name: "Customer Two" }, org.slug);

    const customers = await service.getAllProducts(org.slug);
    expect(customers).toBeDefined();
    expect(customers.length).toBeGreaterThanOrEqual(2);
    expect(customers).toContainEqual(expect.objectContaining({ id: customer1.id }));
    expect(customers).toContainEqual(expect.objectContaining({ id: customer2.id }));
    expect(customers[0].organizationId).toBe(org!.id);
    expect(customers[1].organizationId).toBe(org!.id);
  });
});
