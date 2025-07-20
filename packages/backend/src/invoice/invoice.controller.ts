import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import Express from "express";

import type { JwtPayload } from "../auth/auth.dto";
import type { PaginationDto } from "../pagination.dto";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import {
  CreatePurchaseInvoiceDto,
  CreateSaleInvoiceDto,
  GetAllInvoicesQueryDto,
  InvoiceEntity,
} from "./invoice.dto";
import { InvoiceService } from "./invoice.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("invoices")
@Controller("/orgs/:orgSlug/invoices")
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Get()
  @ApiOkResponse({ type: [InvoiceEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() query?: GetAllInvoicesQueryDto,
  ): Promise<InvoiceEntity[]> {
    const invoices = await this.service.getAllInvoices(orgSlug, {
      pagination: {
        skip: query?.skip || 0,
        take: query?.take ?? 30,
      },
      where: {
        type: query?.type,
      },
      orderBy: { createdAt: "desc" },
    });
    return invoices.map((invoice) => new InvoiceEntity(invoice));
  }

  @Post("createSale")
  @ApiCreatedResponse()
  async createSale(
    @Param("orgSlug") orgSlug: string,
    @Body() createInvoiceDto: CreateSaleInvoiceDto,
    @Req() req: Express.Request,
  ): Promise<void> {
    const currentUser = req["user"] as JwtPayload;
    await this.service.createSaleInvoice(orgSlug, createInvoiceDto, currentUser.sub);
  }

  @Post("createPurchase")
  @ApiCreatedResponse()
  async createPurchase(
    @Param("orgSlug") orgSlug: string,
    @Body() createPurchaseInvoiceDto: CreatePurchaseInvoiceDto,
    @Req() req: Express.Request,
  ): Promise<void> {
    const currentUser = req["user"] as JwtPayload;
    await this.service.createPurchaseInvoice(orgSlug, createPurchaseInvoiceDto, currentUser.sub);
  }

  @Get("customer/:customerId")
  @ApiOkResponse({ type: [InvoiceEntity] })
  async getByCustomerId(
    @Param("orgSlug") orgSlug: string,
    @Param("customerId") customerId: number,
    @Query() pagination?: PaginationDto,
  ): Promise<InvoiceEntity[]> {
    const invoices = await this.service.getInvoicesByCustomerId(orgSlug, customerId, {
      pagination,
    });
    return invoices.map((invoice) => new InvoiceEntity(invoice));
  }
}
