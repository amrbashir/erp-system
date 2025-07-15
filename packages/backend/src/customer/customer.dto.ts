import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

import type { Customer } from "../prisma/generated/client";

export class CreateCustomerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdateCustomerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
}

export class CustomerEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.name = customer.name;
    this.address = customer.address || undefined;
    this.phone = customer.phone || undefined;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
    this.deletedAt = customer.deletedAt || undefined;
  }
}
