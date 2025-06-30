import { Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Customer, Transaction, User } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";

export type TransactionWithRelations = Transaction & {
  customer: Customer | null;
  cashier: User;
};

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(amount: number, orgSlug: string, userId: string): Promise<Transaction> {
    try {
      return await this.prisma.transaction.create({
        data: {
          amount,
          cashier: { connect: { id: userId } },
          organization: { connect: { slug: orgSlug } },
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }

  async getAllTransactions(
    orgSlug: string,
    paginationDto?: PaginationDto,
  ): Promise<TransactionWithRelations[]> {
    try {
      return await this.prisma.transaction.findMany({
        where: { organization: { slug: orgSlug } },
        skip: paginationDto?.skip,
        take: paginationDto?.take,
        include: {
          customer: true,
          cashier: true,
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }
}
