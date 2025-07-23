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

import type { OrganizationWithStatistics } from "./org.service";
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

export class BalanceAtDateStisticDto {
  @ApiProperty()
  date: Date;

  @ApiProperty({ format: "number" })
  balance: string;
}

export class OrgStatisticsDto {
  @ApiProperty({ format: "number" })
  balance: string;

  @ApiProperty()
  transactionCount: number;

  @ApiProperty({ type: [BalanceAtDateStisticDto] })
  balanceAtDate: BalanceAtDateStisticDto[];
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

  @ApiPropertyOptional({ type: OrgStatisticsDto })
  statistics?: OrgStatisticsDto;

  constructor(org: OrganizationWithStatistics, userRole: UserRole) {
    this.id = org.id;
    this.name = org.name;
    this.slug = org.slug;
    this.balance = userRole === UserRole.ADMIN ? org.balance?.toString() : undefined;
    this.statistics = org.statistics;
  }
}

export class AddBalanceDto {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}
