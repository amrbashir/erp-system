import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import type { Product } from "../prisma/generated/client";

export class ProductEntity {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  bardcode?: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ format: "number" })
  purchasePrice: string;

  @ApiProperty({ format: "number" })
  sellingPrice: string;

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
    this.purchasePrice = product.purchasePrice.toString();
    this.sellingPrice = product.sellingPrice.toString();
    this.stockQuantity = product.stockQuantity;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
