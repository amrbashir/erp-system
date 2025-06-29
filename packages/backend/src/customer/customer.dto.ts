import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

import type { Customer } from "../prisma/generated/client";

export class CreateCustomerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ format: "email" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
}

export class CustomerEntity implements Customer {
  @ApiProperty()
  name: string;
  @ApiPropertyOptional()
  email: string;
  @ApiPropertyOptional()
  phone: string;
  @ApiProperty()
  id: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiPropertyOptional()
  deletedAt: Date;
  @ApiProperty()
  organizationId: string;
}
