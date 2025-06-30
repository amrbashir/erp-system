import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

import type { Product } from "../prisma/generated/client";

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  purchase_price: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  selling_price: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  stock_quantity: number;
}

export class ProductEntity {
  @ApiProperty()
  id: string;

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
    this.description = product.description;
    this.purchase_price = product.purchase_price;
    this.selling_price = product.selling_price;
    this.stock_quantity = product.stock_quantity;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
