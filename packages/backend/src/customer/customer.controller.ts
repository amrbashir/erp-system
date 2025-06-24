import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CreateCustomerDto, CustomerEntity } from "./customer.dto";
import { CustomerService } from "./customer.service";
import {
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import type { Customer } from "../prisma/generated";
import type { PaginationDto } from "../pagination.dto";

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
  @ApiOkResponse({ type: [CustomerEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<Customer[]> {
    return this.service.getAllCustomers(orgSlug, paginationDto);
  }
}
