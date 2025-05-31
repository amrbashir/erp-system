import { IsAlphanumeric, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateUserDto {
  @IsAlphanumeric()
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsAlphanumeric()
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsNumber()
  @IsNotEmpty()
  organizationId?: number;

  constructor(username: string, password: string, organizationId?: number) {
    this.username = username;
    this.password = password;
    this.organizationId = organizationId;
  }
}
