import {
  IsAlphanumeric,
  IsAscii,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOrgDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsAscii()
  @IsOptional()
  slug?: string;

  @ApiProperty()
  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ minLength: 8 })
  @IsAscii()
  @MinLength(8)
  password: string;
}
