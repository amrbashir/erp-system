import { z } from "zod";

import { PaginationDto } from "@/dto/pagination.dto.ts";
import { SortingDto } from "@/dto/sorting.dto.ts";
import { authenticatedOrgProcedure } from "@/org/org.procedure.ts";
import { InvoiceType } from "@/prisma/index.ts";
import { router } from "@/trpc/index.ts";

import { CreatePurchaseInvoiceDto, CreateSaleInvoiceDto } from "./invoice.dto.ts";

export const invoiceRouter = router({
  getAll: authenticatedOrgProcedure
    .input(
      z.object({
        pagination: PaginationDto.optional(),
        sorting: SortingDto.optional(),
        type: z.enum(InvoiceType).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.invoiceService.getAllInvoices(input.orgSlug, {
        pagination: input.pagination,
        orderBy: input.sorting,
        where: { type: input.type },
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
    .input(
      z.object({
        customerId: z.number(),
        pagination: PaginationDto.optional(),
        sorting: SortingDto.optional(),
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
