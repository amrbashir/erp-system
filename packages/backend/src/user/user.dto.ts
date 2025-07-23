import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsAlphanumeric, IsAscii, IsEnum, IsOptional, MinLength } from "class-validator";

import type { User } from "../prisma/generated/client";
import { UserRole } from "../prisma/generated/client";

export class CreateUserDto {
  @ApiProperty({ minLength: 3 })
  @IsAlphanumeric()
  @MinLength(3)
  username: string;

  @ApiProperty({ minLength: 8 })
  @IsAscii()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  constructor(customer: User) {
    this.id = customer.id;
    this.username = customer.username;
    this.role = customer.role;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
    this.deletedAt = customer.deletedAt || undefined;
  }
}
