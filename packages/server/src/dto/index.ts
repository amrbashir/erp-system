import { z } from "zod";

import { PaginationDto } from "./pagination.dto.ts";
import { SortingDto } from "./sorting.dto.ts";

export const FilteringDto = z.object({
  search: z.string().trim().optional(),
  pagination: PaginationDto.optional(),
  sort: SortingDto.optional(),
});
