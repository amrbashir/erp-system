import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString } from "class-validator";

import type { Product } from "../prisma/generated/client";

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ format: "number" })
  @IsNumberString()
  @IsOptional()
  purchasePrice?: string;

  @ApiPropertyOptional({ format: "number" })
  @IsNumberString()
  @IsOptional()
  sellingPrice?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  stockQuantity?: number;
}

export class ProductEntity {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  barcode?: string;

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
    this.barcode = product.barcode || undefined;
    this.description = product.description;
    this.purchasePrice = product.purchasePrice.toString();
    this.sellingPrice = product.sellingPrice.toString();
    this.stockQuantity = product.stockQuantity;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
