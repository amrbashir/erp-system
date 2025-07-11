import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import type { Product } from "../prisma/generated/client";

export class ProductEntity {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  bardcode?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  purchasePrice: number;

  @ApiProperty()
  sellingPrice: number;

  @ApiProperty()
  stockQuantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(product: Product) {
    this.id = product.id;
    this.bardcode = product.barcode || undefined;
    this.description = product.description;
    this.purchasePrice = product.purchasePrice;
    this.sellingPrice = product.sellingPrice;
    this.stockQuantity = product.stockQuantity;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
