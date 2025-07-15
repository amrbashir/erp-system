import { ConflictException } from "@nestjs/common";
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
    expect(product.purchasePrice.toNumber()).toBe(createProductDto.purchasePrice);
    expect(product.sellingPrice.toNumber()).toBe(createProductDto.sellingPrice);
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

    const updatedProduct = await service.updateProduct(product.id, updateProductDto, org.slug);

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

    await expect(service.updateProduct(product2.id, updateProductDto, org.slug)).rejects.toThrow(
      ConflictException,
    );
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

    await expect(service.updateProduct(product2.id, updateProductDto, org.slug)).rejects.toThrow(
      ConflictException,
    );
  });
});
