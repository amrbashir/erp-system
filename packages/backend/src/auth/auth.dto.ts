import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsAscii, IsNotEmpty } from "class-validator";

import { UserRole } from "../prisma/generated/client";

export class LoginUserDto {
  @ApiProperty()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsAscii()
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty()
  username: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  orgSlug: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken: string;
}

export type JwtTokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string; // User ID
  username: string;
  organizationId: string;
  role: UserRole;
};
