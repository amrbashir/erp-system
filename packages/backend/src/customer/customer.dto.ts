import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

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
  /**  Amount the customer owes to the organization */
  @ApiProperty({ format: "number" })
  owes?: string;

  /**  Amount the organization owes to the customer */
  @ApiProperty({ format: "number" })
  owed?: string;

  constructor(details: NonNullable<CustomerWithDetails["details"]>) {
    this.owes = details.owes ? details.owes.toString() : "0";
    this.owed = details.owed ? details.owed.toString() : "0";
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
