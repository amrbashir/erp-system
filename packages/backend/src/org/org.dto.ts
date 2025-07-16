import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsAlphanumeric,
  IsAscii,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

import type { Organization } from "../prisma/generated/client";
import { UserRole } from "../prisma/generated/client";

export class CreateOrgDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsAscii()
  @IsNotEmpty()
  slug?: string;

  @ApiProperty()
  @IsAlphanumeric()
  @MinLength(3)
  username: string;

  @ApiProperty({ minLength: 8 })
  @IsAscii()
  @MinLength(8)
  password: string;
}

export class OrganizationEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  balance?: string;

  constructor(org: Organization, userRole: UserRole) {
    this.id = org.id;
    this.name = org.name;
    this.slug = org.slug;
    this.balance = userRole === UserRole.ADMIN ? org.balance?.toString() : undefined;
  }
}

export class AddBalanceDto {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}
