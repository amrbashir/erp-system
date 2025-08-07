import { TransactionType } from "@/prisma.ts";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { Decimal } from "decimal.js";

import type { PaginationDto } from "@/pagination.dto.ts";
import type { PrismaClient } from "@/prisma-client.ts";
import type { Expense, User } from "@/prisma.ts";

import type { CreateExpenseDto } from "./expense.dto.ts";

export type ExpenseWithCashier = Expense & {
  cashier: Pick<User, "username" | "id">;
};

export class ExpenseService {
  constructor(private readonly prisma: PrismaClient) {}

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

  async getAll(orgSlug: string, paginationDto?: PaginationDto): Promise<ExpenseWithCashier[]> {
    try {
      return await this.prisma.expense.findMany({
        where: { organization: { slug: orgSlug } },
        skip: paginationDto?.skip,
        take: paginationDto?.take,
        include: {
          cashier: { select: { id: true, username: true } },
        },
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
}
