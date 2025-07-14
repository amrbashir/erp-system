import { Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Expense, User } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";

export type ExpenseWithRelations = Expense & {
  cashier: User;
};

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllExpenses(
    orgSlug: string,
    paginationDto?: PaginationDto,
  ): Promise<ExpenseWithRelations[]> {
    try {
      return await this.prisma.expense.findMany({
        where: { organization: { slug: orgSlug } },
        skip: paginationDto?.skip,
        take: paginationDto?.take,
        include: {
          cashier: true,
        },
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
