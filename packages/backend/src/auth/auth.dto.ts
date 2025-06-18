import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsAscii, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginUserDto {
  @ApiProperty()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ minLength: 8 })
  @IsNotEmpty()
  @IsAscii()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organization: string;
}

export type JwtTokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string; // User ID
  organizationId: string; // Organization ID
};
