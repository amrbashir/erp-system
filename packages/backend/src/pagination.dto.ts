import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, Max, Min } from "class-validator";

export class PaginationDto {
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Min(0)
  skip: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 30 })
  @IsOptional()
  @Min(1)
  @Max(100)
  take: number = 30;
}
