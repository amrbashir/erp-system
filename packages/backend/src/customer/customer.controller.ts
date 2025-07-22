import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";

import type { Customer } from "../prisma/generated/client";
import { AuthenticatedGuard } from "../auth/auth.authenticated.guard";
import { AuthUser } from "../auth/auth.user.decorator";
import { PaginationDto } from "../pagination.dto";
import {
  CollectMoneyDto,
  CreateCustomerDto,
  CustomerEntity,
  PayMoneyDto,
  UpdateCustomerDto,
} from "./customer.dto";
import { CustomerService } from "./customer.service";

@UseGuards(AuthenticatedGuard)
@ApiTags("customers")
@Controller("/orgs/:orgSlug/customers")
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Get()
  @ApiOkResponse({ type: [CustomerEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<CustomerEntity[]> {
    const customers = await this.service.getAllCustomers(orgSlug, paginationDto);
    return customers.map((c) => new CustomerEntity(c));
  }

  @Post("create")
  @ApiCreatedResponse({ type: CustomerEntity })
  async create(
    @Param("orgSlug") orgSlug: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    return this.service.createCustomer(createCustomerDto, orgSlug);
  }

  @Get(":id")
  @ApiOkResponse({ type: CustomerEntity })
  async getById(
    @Param("orgSlug") orgSlug: string,
    @Param("id") id: number,
  ): Promise<CustomerEntity | null> {
    const custoemr = await this.service.findCustomerById(id, orgSlug);
    return custoemr ? new CustomerEntity(custoemr) : null;
  }

  @Post(":id/update")
  @ApiOkResponse({ type: CustomerEntity })
  async update(
    @Param("orgSlug") orgSlug: string,
    @Param("id") id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.service.updateCustomer(id, updateCustomerDto, orgSlug);
  }

  @Post(":id/collect")
  async collect(
    @Param("orgSlug") orgSlug: string,
    @Param("id") id: number,
    @Body() collectDto: CollectMoneyDto,
    @AuthUser("id") userId: string,
  ): Promise<void> {
    await this.service.collectMoney(id, collectDto, orgSlug, userId);
  }

  @Post(":id/pay")
  async pay(
    @Param("orgSlug") orgSlug: string,
    @Param("id") id: number,
    @Body() payDto: PayMoneyDto,
    @AuthUser("id") userId: string,
  ): Promise<void> {
    await this.service.payMoney(id, payDto, orgSlug, userId);
  }
}
