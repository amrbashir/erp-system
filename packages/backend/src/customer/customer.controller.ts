import { Body, Controller, Post, Query, UseGuards } from "@nestjs/common";
import { CreateCustomerDto, CustomerEntity, PaginationDto } from "./customer.dto";
import { CustomerService } from "./customer.service";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import type { Customer } from "../prisma/generated";

@UseGuards(JwtAuthGuard)
@ApiTags("customer")
@Controller("customer")
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Post("create")
  @ApiCreatedResponse({ type: CustomerEntity })
  create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.service.createCustomer(createCustomerDto);
  }

  @Post("getAll")
  async getAll(@Query() paginationDto: PaginationDto): Promise<Customer[]> {
    return this.service.getAllCustomers(paginationDto);
  }
}
