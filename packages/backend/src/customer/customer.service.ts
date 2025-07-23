import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Customer, Transaction } from "../prisma/generated/client";
import type {
  CollectMoneyDto,
  CreateCustomerDto,
  CustomerDetails,
  PayMoneyDto,
  UpdateCustomerDto,
} from "./customer.dto";
import { Prisma, TransactionType } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";

export type CustomerWithDetails = Customer & { details?: CustomerDetails };

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

      let customerBalance = new Prisma.Decimal(0);

      if (customer) {
        const sales = await prisma.invoice.aggregate({
          where: { customerId: id, organization: { slug: orgSlug }, type: "SALE" },
          _sum: { remaining: true },
        });
        const purchases = await prisma.invoice.aggregate({
          where: { customerId: id, organization: { slug: orgSlug }, type: "PURCHASE" },
          _sum: { remaining: true },
        });
        const moneyCollected = await prisma.transaction.aggregate({
          where: {
            customerId: id,
            organization: { slug: orgSlug },
            type: TransactionType.COLLECT_FROM_CUSTOMER,
          },
          _sum: { amount: true },
        });
        const moneyPaid = await prisma.transaction.aggregate({
          where: {
            customerId: id,
            organization: { slug: orgSlug },
            type: TransactionType.PAY_TO_CUSTOMER,
          },
          _sum: { amount: true },
        });

        const amountReceivable = sales._sum.remaining ?? new Prisma.Decimal(0);
        const amountPayable = purchases._sum.remaining ?? new Prisma.Decimal(0);
        const amountCollected = moneyCollected._sum.amount ?? new Prisma.Decimal(0);
        const amountPaid = moneyPaid._sum.amount ?? new Prisma.Decimal(0);
        customerBalance = amountPayable.add(amountCollected).sub(amountReceivable).add(amountPaid);
      }

      return {
        ...customer,
        details: {
          balance: customerBalance.toString(),
        },
      };
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

  async collectMoney(
    id: number,
    collectDto: CollectMoneyDto,
    orgSlug: string,
    userId: string,
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        type: TransactionType.COLLECT_FROM_CUSTOMER,
        amount: collectDto.amount,
        cashier: { connect: { id: userId } },
        customer: { connect: { id } },
        organization: { connect: { slug: orgSlug } },
      },
    });
  }

  async payMoney(
    id: number,
    collectDto: PayMoneyDto,
    orgSlug: string,
    userId: string,
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        type: TransactionType.PAY_TO_CUSTOMER,
        amount: new Prisma.Decimal(collectDto.amount).negated(), // Negated because we paying the customer
        cashier: { connect: { id: userId } },
        customer: { connect: { id } },
        organization: { connect: { slug: orgSlug } },
      },
    });
  }
}
