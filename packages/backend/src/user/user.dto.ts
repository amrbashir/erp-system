import { IsAlphanumeric, IsAscii, IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";

export class CreateUserDto {
  @IsAlphanumeric()
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsAscii()
  @MinLength(8)
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  constructor(username: string, password: string, organizationId: string) {
    this.username = username;
    this.password = password;
    this.organizationId = organizationId;
  }
}
