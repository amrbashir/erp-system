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

  constructor(org: OrganizationWithStatistics) {
    this.balance = org.statistics?.balance || "0";
    this.transactionCount = org.statistics?.transactionCount || 0;
    this.balanceAtDate = org.statistics?.balanceAtDate || [];
  }
}

export class OrganizationEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  constructor(org: OrganizationWithStatistics, userRole: UserRole) {
    this.id = org.id;
    this.name = org.name;
    this.slug = org.slug;
  }
}

export class OrganizationEntityWithStatistics extends OrganizationEntity {
  @ApiProperty({ type: OrgStatisticsDto })
  statistics?: OrgStatisticsDto;

  constructor(org: OrganizationWithStatistics, userRole: UserRole) {
    super(org, userRole);
    this.statistics = org.statistics ? new OrgStatisticsDto(org) : undefined;
  }
}

export class AddBalanceDto {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}
