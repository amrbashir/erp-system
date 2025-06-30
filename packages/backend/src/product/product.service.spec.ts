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

    const createProductDto: CreateProductDto = {
      description: "Test Product",
      purchase_price: 100,
      selling_price: 150,
      stock_quantity: 50,
    };

    const product = await service.createProduct(org.slug, createProductDto);
    expect(product).toBeDefined();
    expect(product.description).toBe(createProductDto.description);
    expect(product.purchase_price).toBe(createProductDto.purchase_price);
    expect(product.selling_price).toBe(createProductDto.selling_price);
    expect(product.stock_quantity).toBe(createProductDto.stock_quantity);
    expect(product.organizationId).toBe(org.id);
    expect(product.storeId).toBeNull();
  });

  it("should return all products", async () => {
    const org = await orgService.create({
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    });

    const product1 = await service.createProduct(org.slug, {
      description: "Product One",
      purchase_price: 100,
      selling_price: 150,
      stock_quantity: 50,
    });

    const product2 = await service.createProduct(org.slug, {
      description: "Product Two",
      purchase_price: 200,
      selling_price: 250,
      stock_quantity: 25,
    });

    const products = await service.getAllProducts(org.slug);
    expect(products).toBeDefined();
    expect(products.length).toBeGreaterThanOrEqual(2);
    expect(products).toContainEqual(expect.objectContaining({ id: product1.id }));
    expect(products).toContainEqual(expect.objectContaining({ id: product2.id }));
    expect(products.find((p) => p.id === product1.id)?.description).toBe("Product One");
    expect(products.find((p) => p.id === product2.id)?.description).toBe("Product Two");
    expect(products.find((p) => p.id === product1.id)?.organizationId).toBe(org.id);
    expect(products.find((p) => p.id === product2.id)?.organizationId).toBe(org.id);
  });

  it("should throw NotFoundException when organization does not exist", async () => {
    const createProductDto: CreateProductDto = {
      description: "Test Product",
      purchase_price: 100,
      selling_price: 150,
      stock_quantity: 50,
    };

    await expect(service.createProduct("non-existent-org", createProductDto)).rejects.toThrow(
      "Organization with this slug does not exist",
    );
  });
});
