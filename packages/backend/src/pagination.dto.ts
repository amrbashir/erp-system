import { ApiPropertyOptional } from "@nestjs/swagger";
import { Max, Min } from "class-validator";

export class PaginationDto {
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @Min(0)
  skip: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 30 })
  @Min(1)
  @Max(100)
  take: number = 30;
}
