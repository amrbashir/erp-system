import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CreateCustomerDto } from "./customer.dto";
import { CustomerService } from "./customer.service";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";

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
}
