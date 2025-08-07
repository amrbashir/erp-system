import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { Decimal } from "decimal.js";

import type { PaginationDto } from "@/pagination.dto.ts";
import type { PrismaClient } from "@/prisma-client.ts";
import type { Customer, Transaction } from "@/prisma.ts";
import { TransactionType } from "@/prisma.ts";

import type { CreateCustomerDto, CustomerWithDetails, UpdateCustomerDto } from "./customer.dto.ts";

export class CustomerService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: CreateCustomerDto, orgSlug: string): Promise<Customer> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingCustomer = await prisma.customer.findFirst({
          where: { name: dto.name, organization: { slug: orgSlug } },
        });

        if (existingCustomer) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Customer with this name already exists",
          });
        }

        return prisma.customer.create({
          data: {
            name: dto.name,
            phone: dto.phone,
            address: dto.address,
            organization: { connect: { slug: orgSlug } },
          },
        });
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  async findById(id: number, orgSlug: string): Promise<CustomerWithDetails | null> {
    return await this.prisma.$transaction(async (prisma) => {
      const customer = await prisma.customer.findUnique({
        where: { id, organization: { slug: orgSlug } },
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer with this ID does not exist in the organization",
        });
      }

      let customerBalance = new Decimal(0);

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

        const amountReceivable = sales._sum.remaining ?? new Decimal(0);
        const amountPayable = purchases._sum.remaining ?? new Decimal(0);
        const amountCollected = moneyCollected._sum.amount ?? new Decimal(0);
        const amountPaid = moneyPaid._sum.amount ?? new Decimal(0);
        customerBalance = amountPayable.add(amountCollected).sub(amountReceivable).add(amountPaid);
      }

      return {
        ...customer,
        details: {
          balance: customerBalance,
        },
      };
    });
  }

  async update(id: number, dto: UpdateCustomerDto, orgSlug: string): Promise<Customer> {
    try {
      return await this.prisma.customer.update({
        where: { id, organization: { slug: orgSlug } },
        data: {
          name: dto.name,
          address: dto.address,
          phone: dto.phone,
        },
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer with this ID does not exist in the organization",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  async getAll(orgSlug: string, paginationDto?: PaginationDto): Promise<Customer[]> {
    try {
      return await this.prisma.customer.findMany({
        where: { organization: { slug: orgSlug } },
        skip: paginationDto?.skip,
        take: paginationDto?.take,
        orderBy: { createdAt: "desc" },
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  collectMoney(id: number, amount: string, orgSlug: string, userId: string): Promise<Transaction> {
    try {
      return this.prisma.transaction.create({
        data: {
          type: TransactionType.COLLECT_FROM_CUSTOMER,
          amount,
          cashier: { connect: { id: userId } },
          customer: { connect: { id } },
          organization: { connect: { slug: orgSlug } },
        },
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer with this ID does not exist in the organization",
        });
      }

      throw error;
    }
  }

  payMoney(id: number, amount: string, orgSlug: string, userId: string): Promise<Transaction> {
    try {
      return this.prisma.transaction.create({
        data: {
          type: TransactionType.PAY_TO_CUSTOMER,
          amount: new Decimal(amount).negated(), // Negated because we paying the customer
          cashier: { connect: { id: userId } },
          customer: { connect: { id } },
          organization: { connect: { slug: orgSlug } },
        },
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer with this ID does not exist in the organization",
        });
      }

      throw error;
    }
  }
}
