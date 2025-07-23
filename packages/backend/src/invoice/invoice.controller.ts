import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { PaginationDto } from "../pagination.dto";
import { AuthenticatedGuard } from "../auth/auth.authenticated.guard";
import { AuthUser } from "../auth/auth.user.decorator";
import {
  CreatePurchaseInvoiceDto,
  CreateSaleInvoiceDto,
  GetAllInvoicesQueryDto,
  InvoiceEntity,
} from "./invoice.dto";
import { InvoiceService } from "./invoice.service";

@UseGuards(AuthenticatedGuard)
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
    @AuthUser("id") userId: string,
  ): Promise<void> {
    await this.service.createSaleInvoice(orgSlug, createInvoiceDto, userId);
  }

  @Post("createPurchase")
  @ApiCreatedResponse()
  async createPurchase(
    @Param("orgSlug") orgSlug: string,
    @Body() createPurchaseInvoiceDto: CreatePurchaseInvoiceDto,
    @AuthUser("id") userId: string,
  ): Promise<void> {
    await this.service.createPurchaseInvoice(orgSlug, createPurchaseInvoiceDto, userId);
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

  @Get(":id")
  @ApiOkResponse({ type: InvoiceEntity })
  async getById(
    @Param("orgSlug") orgSlug: string,
    @Param("id") id: number,
  ): Promise<InvoiceEntity> {
    const invoice = await this.service.getInvoiceById(orgSlug, id);
    return new InvoiceEntity(invoice);
  }
}
