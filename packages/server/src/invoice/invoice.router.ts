import { z } from "zod";

import { FilteringDto } from "@/dto/index.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { InvoiceType } from "@/prisma/index.ts";
import { router } from "@/trpc/index.ts";

import { CreatePurchaseInvoiceDto, CreateSaleInvoiceDto } from "./invoice.dto.ts";

export const invoiceRouter = router({
  getAll: authenticatedOrgProcedure
    .input(FilteringDto)
    .input(
      z.object({
        type: z.enum(InvoiceType).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.invoiceService.getAllInvoices(input.orgSlug, {
        where: {
          type: input.type,
          ...(input.search
            ? {
                OR: [
                  {
                    customer: {
                      name: {
                        contains: input.search,
                        mode: "insensitive",
                      },
                    },
                  },
                  {
                    cashier: {
                      username: {
                        contains: input.search,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        },
        pagination: input.pagination,
        orderBy: input.sorting,
      }),
    ),

  createSale: authenticatedOrgProcedure
    .input(CreateSaleInvoiceDto)
    .mutation(({ ctx, input }) =>
      ctx.invoiceService.createSaleInvoice(input.orgSlug, input, ctx.user.id),
    ),

  createPurchase: authenticatedOrgProcedure
    .input(CreatePurchaseInvoiceDto)
    .mutation(({ ctx, input }) =>
      ctx.invoiceService.createPurchaseInvoice(input.orgSlug, input, ctx.user.id),
    ),

  getById: authenticatedOrgProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.invoiceService.findById(input.orgSlug, input.id)),

  getByCustomerId: authenticatedOrgProcedure
    .input(FilteringDto)
    .input(
      z.object({
        customerId: z.number(),
        type: z.enum(InvoiceType).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.invoiceService.findByCustomerId(input.orgSlug, input.customerId, {
        pagination: input.pagination,
        orderBy: input.sorting,
      }),
    ),
});
