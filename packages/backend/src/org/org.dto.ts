import { IsAlphanumeric, IsNotEmpty, IsString } from "class-validator";

export class CreateOrgDto {
  @IsAlphanumeric()
  @IsString()
  name: string;

  @IsAlphanumeric()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsAlphanumeric()
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsAlphanumeric()
  @IsString()
  @IsNotEmpty()
  password: string;

  constructor(name: string, slug: string, username: string, password: string) {
    this.name = name;
    this.slug = slug;
    this.username = username;
    this.password = password;
  }
}
