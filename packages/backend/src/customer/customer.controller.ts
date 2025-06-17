import { Body, Controller, Post, Query, UseGuards } from "@nestjs/common";
import { CreateCustomerDto, PaginationDto } from "./customer.dto";
import { CustomerService } from "./customer.service";
import { ApiBody, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import type { Customer } from "../prisma/generated";

@UseGuards(JwtAuthGuard)
@ApiTags("customer")
@Controller("customer")
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @ApiBody({ schema: CreateCustomerDto.openapiSchema })
  @Post("create")
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.service.createCustomer(createCustomerDto);
  }

  @ApiQuery({ schema: PaginationDto.openapiSchema })
  @Post("getAll")
  async getAll(@Query() paginationDto: PaginationDto) {
    return this.service.getAllCustomers(paginationDto);
  }
}
