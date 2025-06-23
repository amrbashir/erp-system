import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateCustomerDto, PaginationDto } from "./customer.dto";
import type { Customer } from "../prisma/generated";

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: createCustomerDto.organization },
    });
    if (!org) throw new NotFoundException("Organization with this slug does not exist");

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { name: createCustomerDto.name, organizationId: org.id },
    });

    if (existingCustomer) throw new ConflictException("Customer with this name already exists");

    return this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        organizationId: org.id,
      },
    });
  }

  async getAllCustomers(paginationDto?: PaginationDto): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      skip: paginationDto?.skip,
      take: paginationDto?.take,
    });
  }
}
