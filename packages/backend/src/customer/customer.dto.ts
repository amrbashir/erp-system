import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsOptional, IsString } from "class-validator";

import type { CustomerWithDetails } from "./customer.service";

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;
}

export class UpdateCustomerDto {
  @ApiProperty()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;
}

export class CustomerDetails {
  @ApiProperty({ format: "number" })
  balance?: string;

  constructor(details: NonNullable<CustomerWithDetails["details"]>) {
    this.balance = details.balance.toString();
  }
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

  @ApiPropertyOptional()
  details?: CustomerDetails;

  constructor(customer: CustomerWithDetails) {
    this.id = customer.id;
    this.name = customer.name;
    this.address = customer.address || undefined;
    this.phone = customer.phone || undefined;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
    this.deletedAt = customer.deletedAt || undefined;
    this.details = customer.details ? new CustomerDetails(customer.details) : undefined;
  }
}

export class CollectMoneyDto {
  @ApiProperty({ format: "number" })
  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}

export class PayMoneyDto extends CollectMoneyDto {}
