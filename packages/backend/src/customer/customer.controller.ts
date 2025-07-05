import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import type { Customer } from "../prisma/generated/client";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { PaginationDto } from "../pagination.dto";
import { CreateCustomerDto, CustomerEntity } from "./customer.dto";
import { CustomerService } from "./customer.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("customer")
@Controller("/org/:orgSlug/customer")
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Post("create")
  @ApiCreatedResponse({ type: CustomerEntity })
  create(
    @Param("orgSlug") orgSlug: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    return this.service.createCustomer(createCustomerDto, orgSlug);
  }

  @Get("getAll")
  @ApiQuery({ type: PaginationDto })
  @ApiOkResponse({ type: [CustomerEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<CustomerEntity[]> {
    const customers = await this.service.getAllCustomers(orgSlug, paginationDto);
    return customers.map((c) => new CustomerEntity(c));
  }
}
