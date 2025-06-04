import {
  IsAlphanumeric,
  IsAscii,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateOrgDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsAscii()
  @IsString()
  @IsOptional()
  slug?: string;

  @IsAlphanumeric()
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsAscii()
  @MinLength(8)
  @IsString()
  @IsNotEmpty()
  password: string;

  constructor(name: string, username: string, password: string, slug?: string) {
    this.name = name;
    this.slug = slug;
    this.username = username;
    this.password = password;
  }
}
