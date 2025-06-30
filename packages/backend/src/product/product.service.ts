import { Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Product } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./product.dto";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(orgSlug: string, createProductDto: CreateProductDto): Promise<Product> {
    try {
      return await this.prisma.product.create({
        data: {
          description: createProductDto.description,
          purchase_price: createProductDto.purchase_price,
          selling_price: createProductDto.selling_price,
          stock_quantity: createProductDto.stock_quantity,
          organization: { connect: { slug: orgSlug } },
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
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
