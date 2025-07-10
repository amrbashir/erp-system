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
  purchase_price: number;

  @ApiProperty()
  selling_price: number;

  @ApiProperty()
  stock_quantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(product: Product) {
    this.id = product.id;
    this.bardcode = product.barcode || undefined;
    this.description = product.description;
    this.purchase_price = product.purchase_price;
    this.selling_price = product.selling_price;
    this.stock_quantity = product.stock_quantity;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
