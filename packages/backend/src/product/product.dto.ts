import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

import type { Product } from "../prisma/generated/client";

export class ProductEntity implements Product {
  @ApiProperty()
  description: string;
  @ApiProperty()
  id: string;
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
  @ApiProperty()
  organizationId: string;
  @ApiPropertyOptional()
  storeId: string | null;
}

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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storeId?: string;
}
