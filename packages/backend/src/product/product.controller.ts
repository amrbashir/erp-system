import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { PaginationDto } from "../pagination.dto";
import { ProductEntity, UpdateProductDto } from "./product.dto";
import { ProductService } from "./product.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("products")
@Controller("/orgs/:orgSlug/products")
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  @ApiOkResponse({ type: [ProductEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<ProductEntity[]> {
    const products = await this.service.getAllProducts(orgSlug, paginationDto);
    return products.map((p) => new ProductEntity(p));
  }

  @Post(":id/update")
  @ApiOkResponse({ type: ProductEntity })
  async update(
    @Param("orgSlug") orgSlug: string,
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    const product = await this.service.updateProduct(id, updateProductDto, orgSlug);
    return new ProductEntity(product);
  }
}
