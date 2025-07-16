import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsAlphanumeric,
  IsAscii,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

import type { Organization } from "../prisma/generated/client";

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

  constructor(org: Organization) {
    this.id = org.id;
    this.name = org.name;
    this.slug = org.slug;
  }
}
