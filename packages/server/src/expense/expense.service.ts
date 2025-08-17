import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { Decimal } from "decimal.js";

import type { PaginationDto } from "@/dto/pagination.dto.ts";
import type { PrismaClient } from "@/prisma/client.ts";
import type { ExpenseOrderByWithRelationInput, ExpenseWhereInput } from "@/prisma/index.ts";
import { PaginatedOutput } from "@/dto/pagination.dto.ts";
import { OTelInstrument } from "@/otel/instrument.decorator.ts";
import { TransactionType } from "@/prisma/index.ts";

import type { CreateExpenseDto, ExpenseWithCashier } from "./expense.dto.ts";

export class ExpenseService {
  constructor(private readonly prisma: PrismaClient) {}

  @OTelInstrument
  async create(
    orgSlug: string,
    dto: CreateExpenseDto,
    userId: string,
  ): Promise<ExpenseWithCashier> {
    try {
      const cashier = { connect: { id: userId } };
      const organization = { connect: { slug: orgSlug } };
      const decimalAmount = new Decimal(dto.amount);

      return await this.prisma.expense.create({
        data: {
          description: dto.description,
          amount: decimalAmount,
          organization,
          cashier,
          transaction: {
            create: {
              type: TransactionType.EXPENSE,
              amount: decimalAmount.negated(), // negated since it's an expense
              organization,
              cashier,
            },
          },
        },
        include: {
          cashier: { select: { id: true, username: true } },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  @OTelInstrument
  async getAll(
    orgSlug: string,
    options?: {
      where?: Omit<ExpenseWhereInput, "organization" | "organizationId">;
      pagination?: PaginationDto;
      orderBy?: ExpenseOrderByWithRelationInput | ExpenseOrderByWithRelationInput[];
    },
  ): Promise<PaginatedOutput<ExpenseWithCashier[]>> {
    try {
      const where = {
        ...options?.where,
        organization: { slug: orgSlug },
      };

      const expenses = await this.prisma.expense.findMany({
        where,
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        orderBy: options?.orderBy ?? { createdAt: "desc" },
        include: {
          cashier: { select: { id: true, username: true } },
        },
      });

      const totalCount = await this.prisma.expense.count({ where });

      return { data: expenses, totalCount };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization with this slug does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }
}
