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

  @ApiProperty()
  @IsNotEmpty()
  organization: string;
}

export class PaginationDto {
  @ApiProperty({ minimum: 0, default: 0 })
  @Min(0)
  skip: number = 0;

  @ApiProperty({ minimum: 1, maximum: 100, default: 30 })
  @Min(1)
  @Max(100)
  take: number = 30;
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
