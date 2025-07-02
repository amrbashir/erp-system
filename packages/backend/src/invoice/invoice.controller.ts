import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { PaginationDto } from "../pagination.dto";
import type { Invoice } from "../prisma/generated/client";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { AdminGuard } from "../user/user.admin.guard";
import { InvoiceEntity } from "./invoice.dto";
import { InvoiceService } from "./invoice.service";

@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("invoice")
@Controller("/org/:orgSlug/invoice")
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Get("getAll")
  @ApiOkResponse({ type: [InvoiceEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<Invoice[]> {
    return this.service.getAllInvoices(orgSlug, paginationDto);
  }
}
