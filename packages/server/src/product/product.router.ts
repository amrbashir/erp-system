import z from "zod";

import { PaginationDto } from "@/dto/pagination.dto.ts";
import { SortingDto } from "@/dto/sorting.dto.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { router } from "@/trpc/index.ts";

import { ProductIdDto, UpdateProductDto } from "./product.dto.ts";

const productProcedure = authenticatedOrgProcedure.input(ProductIdDto);

export const productRouter = router({
  getAll: authenticatedOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional(), sorting: SortingDto.optional() }))
    .query(({ ctx, input }) =>
      ctx.productService.getAll(input.orgSlug, {
        pagination: input.pagination,
        orderBy: input.sorting,
      }),
    ),

  update: productProcedure
    .input(UpdateProductDto)
    .mutation(({ ctx, input }) => ctx.productService.update(input.productId, input, input.orgSlug)),
});
