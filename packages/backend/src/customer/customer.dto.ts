import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";
import type { Customer } from "../prisma/generated";

export class CreateCustomerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
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
