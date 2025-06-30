import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";

import type { PaginationDto } from "../pagination.dto";
import type { Product } from "../prisma/generated/client";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { CreateProductDto, ProductEntity } from "./product.dto";
import { ProductService } from "./product.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("product")
@Controller("/org/:orgSlug/product")
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get("getAll")
  @ApiOkResponse({ type: [ProductEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<Product[]> {
    return this.service.getAllProducts(orgSlug, paginationDto);
  }

  @Post("create")
  @ApiCreatedResponse({ type: ProductEntity })
  async createProduct(
    @Param("orgSlug") orgSlug: string,
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return this.service.createProduct(orgSlug, createProductDto);
  }
}
