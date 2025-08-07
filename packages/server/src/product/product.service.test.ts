import { expect } from "@std/expect";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

import { OrgService } from "@/org/org.service.ts";
import { PrismaClient } from "@/prisma-client.ts";

import { generateRandomOrgData, useRandomDatabase } from "../../../utils/src/testing.ts";
import { ProductService } from "./product.service.ts";

describe("ProductService", () => {
  let productService: ProductService;
  let prisma: PrismaClient;
  let orgService: OrgService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    await createDatabase();
    prisma = new PrismaClient();
    orgService = new OrgService(prisma);
    productService = new ProductService(prisma);
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
    expect(product.purchasePrice.toNumber()).toBe(createProductDto.purchasePrice);
    expect(product.sellingPrice.toNumber()).toBe(createProductDto.sellingPrice);
    expect(product.stockQuantity).toBe(createProductDto.stockQuantity);
    expect(product.organizationId).toBe(org.id);
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

    const products = await productService.getAll(org.slug);
    expect(products).toBeDefined();
    expect(products.length).toBeGreaterThanOrEqual(2);
    expect(products).toContainEqual(expect.objectContaining({ id: product1.id }));
    expect(products).toContainEqual(expect.objectContaining({ id: product2.id }));
    expect(products.find((p) => p.id === product1.id)?.description).toBe("Product One");
    expect(products.find((p) => p.id === product2.id)?.description).toBe("Product Two");
    expect(products.find((p) => p.id === product1.id)?.organizationId).toBe(org.id);
    expect(products.find((p) => p.id === product2.id)?.organizationId).toBe(org.id);
  });

  it("should update a product successfully with partial updates", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    // Create a product first
    const createProductDto = {
      description: "Product to update",
      purchasePrice: 100,
      sellingPrice: 150,
      stockQuantity: 50,
      organizationId: org.id,
    };

    const product = await prisma.product.create({ data: createProductDto });

    // Partial update with only some fields
    const updateProductDto = {
      description: "Updated product",
      sellingPrice: "200",
    };

    const updatedProduct = await productService.update(product.id, updateProductDto, org.slug);

    expect(updatedProduct).toBeDefined();
    expect(updatedProduct.id).toBe(product.id);
    expect(updatedProduct.description).toBe(updateProductDto.description);
    expect(updatedProduct.sellingPrice.toNumber()).toBe(Number(updateProductDto.sellingPrice));
    // Fields not included in the update should remain unchanged
    expect(updatedProduct.stockQuantity).toBe(createProductDto.stockQuantity);
    expect(updatedProduct.purchasePrice.toNumber()).toBe(createProductDto.purchasePrice);
  });

  it("should fail to update a product when adding a barcode that already exists", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    // Create first product with a barcode
    await prisma.product.create({
      data: {
        description: "Product with barcode",
        barcode: "12345678",
        purchasePrice: 100,
        sellingPrice: 150,
        stockQuantity: 50,
        organizationId: org.id,
      },
    });

    // Create second product without a barcode
    const product2 = await prisma.product.create({
      data: {
        description: "Product without barcode",
        purchasePrice: 100,
        sellingPrice: 150,
        stockQuantity: 50,
        organizationId: org.id,
      },
    });

    // Try to update the second product with the same barcode as the first
    const updateProductDto = {
      barcode: "12345678",
    };

    const result = productService.update(product2.id, updateProductDto, org.slug);
    await expect(result).rejects.toThrow();
  });

  it("should fail to update a product when changing description to one that already exists", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    // Create first product
    await prisma.product.create({
      data: {
        description: "Unique Product Description",
        purchasePrice: 100,
        sellingPrice: 150,
        stockQuantity: 50,
        organizationId: org.id,
      },
    });

    // Create second product
    const product2 = await prisma.product.create({
      data: {
        description: "Another Product Description",
        purchasePrice: 200,
        sellingPrice: 250,
        stockQuantity: 30,
        organizationId: org.id,
      },
    });

    // Try to update the second product with the same description as the first
    const updateProductDto = {
      description: "Unique Product Description",
    };

    const result = productService.update(product2.id, updateProductDto, org.slug);
    await expect(result).rejects.toThrow();
  });
});
