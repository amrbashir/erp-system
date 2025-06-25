import {
  IsAlphanumeric,
  IsAscii,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Organization } from "../prisma/generated/client";

export class CreateOrgDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsAscii()
  @IsOptional()
  slug?: string;

  @ApiProperty()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ minLength: 8 })
  @IsAscii()
  @MinLength(8)
  password: string;
}

export class OrganizationEntity implements Partial<Organization> {
  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}
