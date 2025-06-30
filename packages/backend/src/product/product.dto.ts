import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
