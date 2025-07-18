import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Product } from "../prisma/generated/client";
import type { UpdateProductDto } from "./product.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    orgSlug: string,
  ): Promise<Product> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              updateProductDto.barcode
                ? {
                    barcode: updateProductDto.barcode,
                    organization: { slug: orgSlug },
                  }
                : {},
              {
                description: updateProductDto.description,
                organization: { slug: orgSlug },
              },
            ],
          },
        });

        if (existingProduct && existingProduct.id !== id) {
          if (existingProduct.description === updateProductDto.description) {
            throw new ConflictException("A product with this description already exists");
          }

          if (existingProduct.barcode === updateProductDto.barcode) {
            throw new ConflictException("A product with this barcode already exists");
          }
        }

        return prisma.product.update({
          where: { id, organization: { slug: orgSlug } },
          data: updateProductDto,
        });
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Product with this ID does not exist in the organization");
      }

      throw error; // Re-throw other errors
    }
  }

  async getAllProducts(orgSlug: string, paginationDto?: PaginationDto): Promise<Product[]> {
    try {
      return await this.prisma.product.findMany({
        where: { organization: { slug: orgSlug } },
        skip: paginationDto?.skip,
        take: paginationDto?.take,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }
}
