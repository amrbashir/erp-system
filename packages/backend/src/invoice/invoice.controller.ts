import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import type { JwtPayload } from "../auth/auth.dto";
import type { Invoice } from "../prisma/generated/client";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { PaginationDto } from "../pagination.dto";
import { CreateInvoiceDto, InvoiceEntity } from "./invoice.dto";
import { InvoiceService } from "./invoice.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("invoice")
@Controller("/org/:orgSlug/invoice")
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Post("create")
  @ApiCreatedResponse()
  async create(
    @Param("orgSlug") orgSlug: string,
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() req: any,
  ): Promise<void> {
    const currentUser = req["user"] as JwtPayload;
    await this.service.createInvoice(orgSlug, createInvoiceDto, currentUser.sub);
  }

  @Get("getAll")
  @ApiQuery({ type: PaginationDto })
  @ApiOkResponse({ type: [InvoiceEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<InvoiceEntity[]> {
    const invoices = await this.service.getAllInvoices(orgSlug, paginationDto);
    return invoices.map((invoice) => new InvoiceEntity(invoice));
  }
}
