import z from "zod";

import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { PaginationDto } from "@/pagination.dto.ts";
import { router } from "@/trpc/index.ts";

import { ProductIdDto, UpdateProductDto } from "./product.dto.ts";

const productProcedure = authenticatedOrgProcedure.input(ProductIdDto);

export const productRouter = router({
  getAll: authenticatedOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional() }))
    .query(({ ctx, input }) => ctx.productService.getAll(input.orgSlug, input.pagination)),

  update: productProcedure
    .input(UpdateProductDto)
    .mutation(({ ctx, input }) => ctx.productService.update(input.productId, input, input.orgSlug)),
});
