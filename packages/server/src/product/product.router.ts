import { FilteringDto } from "@/dto/index.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { router } from "@/trpc/index.ts";

import { ProductIdDto, UpdateProductDto } from "./product.dto.ts";

const productProcedure = authenticatedOrgProcedure.input(ProductIdDto);

export const productRouter = router({
  getAll: authenticatedOrgProcedure.input(FilteringDto).query(({ ctx, input }) =>
    ctx.productService.getAll(input.orgSlug, {
      where: input.search
        ? {
            OR: [
              {
                description: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
              {
                barcode: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : undefined,
      pagination: input.pagination,
      orderBy: input.sort,
    }),
  ),

  update: productProcedure
    .input(UpdateProductDto)
    .mutation(({ ctx, input }) => ctx.productService.update(input.productId, input, input.orgSlug)),
});
