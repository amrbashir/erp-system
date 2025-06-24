import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsAscii, IsNotEmpty, IsString } from "class-validator";
import { UserRole } from "../prisma/generated";

export class LoginUserDto {
  @ApiProperty()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAscii()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty()
  username: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  accessToken: string;
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
  organizationId: string; // Organization ID
};
