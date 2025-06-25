import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsAlphanumeric, IsAscii, IsNotEmpty, MinLength } from "class-validator";
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

  @ApiPropertyOptional({ enum: UserRole })
  role?: UserRole = UserRole.USER;
}

export class DeleteUserDto {
  @ApiProperty()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;
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
