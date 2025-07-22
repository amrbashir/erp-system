import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Customer } from "../prisma/generated/client";
import type { CreateCustomerDto, UpdateCustomerDto } from "./customer.dto";
import { Prisma } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";

export type CustomerWithDetails = Customer & {
  details?: {
    amountReceivable: Prisma.Decimal;
    amountPayable: Prisma.Decimal;
  };
};

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

  async findCustomerById(id: number, orgSlug: string): Promise<CustomerWithDetails | null> {
    return await this.prisma.$transaction(async (prisma) => {
      const customer = await prisma.customer.findUnique({
        where: { id, organization: { slug: orgSlug } },
      });

      if (!customer) {
        throw new NotFoundException("Customer with this ID does not exist in the organization");
      }

      const details: CustomerWithDetails["details"] = {
        amountReceivable: new Prisma.Decimal(0),
        amountPayable: new Prisma.Decimal(0),
      };

      if (customer) {
        const purchasesAgg = await prisma.invoice.groupBy({
          where: { customerId: id, organization: { slug: orgSlug } },
          by: ["type"],
          _sum: { remaining: true },
        });

        const sales = purchasesAgg.find((p) => p.type === "SALE");
        if (sales) details.amountReceivable = sales._sum.remaining ?? new Prisma.Decimal(0);

        const purchases = purchasesAgg.find((p) => p.type === "PURCHASE");
        if (purchases) details.amountPayable = purchases._sum.remaining ?? new Prisma.Decimal(0);
      }

      return { ...customer, details };
    });
  }

  async updateCustomer(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    orgSlug: string,
  ): Promise<Customer> {
    try {
      return await this.prisma.customer.update({
        where: { id, organization: { slug: orgSlug } },
        data: updateCustomerDto,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Customer with this ID does not exist in the organization");
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
