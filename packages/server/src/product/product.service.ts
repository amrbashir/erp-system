import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";

import type { PaginationDto } from "@/pagination.dto.ts";

import type { PrismaClient } from "../prisma/client.ts";
import type { Product } from "../prisma/index.ts";
import type { UpdateProductDto } from "./product.dto.ts";

export class ProductService {
  constructor(private readonly prisma: PrismaClient) {}

  async update(id: string, dto: UpdateProductDto, orgSlug: string): Promise<Product> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              dto.barcode
                ? {
                    barcode: dto.barcode,
                    organization: { slug: orgSlug },
                  }
                : {},
              dto.description
                ? {
                    description: dto.description,
                    organization: { slug: orgSlug },
                  }
                : {},
            ],
          },
        });

        if (existingProduct && existingProduct.id !== id) {
          if (existingProduct.description === dto.description) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A product with this description already exists",
            });
          }

          if (existingProduct.barcode === dto.barcode) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A product with this barcode already exists",
            });
          }
        }

        return await prisma.product.update({
          where: { id, organization: { slug: orgSlug } },
          data: {
            barcode: dto.barcode,
            description: dto.description,
            purchasePrice: dto.purchasePrice,
            sellingPrice: dto.sellingPrice,
            stockQuantity: dto.stockQuantity,
          },
        });
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product with this ID does not exist in the organization",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  async getAll(orgSlug: string, paginationDto?: PaginationDto): Promise<Product[]> {
    try {
      return await this.prisma.product.findMany({
        where: { organization: { slug: orgSlug } },
        skip: paginationDto?.skip,
        take: paginationDto?.take,
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }
}
