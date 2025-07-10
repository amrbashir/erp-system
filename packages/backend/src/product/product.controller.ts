import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { PaginationDto } from "../pagination.dto";
import { ProductEntity } from "./product.dto";
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
    @Query() paginationDto?: PaginationDto,
  ): Promise<ProductEntity[]> {
    const products = await this.service.getAllProducts(orgSlug, paginationDto);
    return products.map((p) => new ProductEntity(p));
  }
}
