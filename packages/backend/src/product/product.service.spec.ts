import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProductService } from "./product.service";

describe("ProductService", async () => {
  let service: ProductService;
  let prisma: PrismaService;
  let orgService: OrgService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaService();
    orgService = new OrgService(prisma);
    service = new ProductService(prisma);
  });

  afterAll(dropDatabase);

  it("should create a product", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createProductDto = {
      description: "Test Product",
      purchasePrice: 100,
      sellingPrice: 150,
      stockQuantity: 50,
    };

    const product = await prisma.product.create({
      data: { ...createProductDto, organizationId: org.id },
    });

    expect(product).toBeDefined();
    expect(product.description).toBe(createProductDto.description);
    expect(product.purchasePrice).toBe(createProductDto.purchasePrice);
    expect(product.sellingPrice).toBe(createProductDto.sellingPrice);
    expect(product.stockQuantity).toBe(createProductDto.stockQuantity);
    expect(product.organizationId).toBe(org.id);
    expect(product.storeId).toBeNull();
  });

  it("should return all products", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const product1 = await prisma.product.create({
      data: {
        description: "Product One",
        purchasePrice: 100,
        sellingPrice: 150,
        stockQuantity: 50,
        organizationId: org.id,
      },
    });

    const product2 = await prisma.product.create({
      data: {
        description: "Product Two",
        purchasePrice: 100,
        sellingPrice: 150,
        stockQuantity: 50,
        organizationId: org.id,
      },
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
});
