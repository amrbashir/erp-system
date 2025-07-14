import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Customer } from "../prisma/generated/client";
import type { CreateCustomerDto } from "./customer.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(createCustomerDto: CreateCustomerDto, orgSlug: string): Promise<Customer> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingCustomer = await prisma.customer.findFirst({
          where: { name: createCustomerDto.name, organization: { slug: orgSlug } },
        });

        if (existingCustomer) throw new ConflictException("Customer with this name already exists");

        return prisma.customer.create({
          data: {
            name: createCustomerDto.name,
            phone: createCustomerDto.phone,
            address: createCustomerDto.address,
            organization: { connect: { slug: orgSlug } },
          },
        });
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }

  async getAllCustomers(orgSlug: string, paginationDto?: PaginationDto): Promise<Customer[]> {
    try {
      return await this.prisma.customer.findMany({
        where: { organization: { slug: orgSlug } },
        skip: paginationDto?.skip,
        take: paginationDto?.take,
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }
}
