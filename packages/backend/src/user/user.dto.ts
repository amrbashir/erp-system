import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsAlphanumeric,
  IsAscii,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
import type { User } from "../prisma/generated";
import { UserRole } from "../prisma/generated/enums";

export class CreateUserDto {
  @ApiProperty()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ minLength: 8 })
  @IsAscii()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organization: string;
}

export class PaginationDto {
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @Min(0)
  skip: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 30 })
  @Min(1)
  @Max(100)
  take: number = 30;
}

export class UserEntity implements Partial<User> {
  @ApiProperty()
  username: string;
  @ApiProperty({ enum: UserRole })
  role: UserRole;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiPropertyOptional()
  deletedAt: Date;
}
