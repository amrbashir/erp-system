import { Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Customer, Transaction, User } from "../prisma/generated/client";
import type {
  TransactionOrderByWithRelationInput,
  TransactionWhereInput,
} from "../prisma/generated/models";
import { PrismaService } from "../prisma/prisma.service";

export type TransactionWithRelations = Transaction & {
  customer: Customer | null;
  cashier: User;
};

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllTransactions(
    orgSlug: string,
    options?: {
      pagination?: PaginationDto;
      where?: Omit<TransactionWhereInput, "organization" | "organizationId">;
      orderBy?:
        | TransactionOrderByWithRelationInput
        | TransactionOrderByWithRelationInput[]
        | undefined;
    },
  ): Promise<TransactionWithRelations[]> {
    try {
      return await this.prisma.transaction.findMany({
        where: {
          ...options?.where,
          organization: { slug: orgSlug },
        },
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        include: {
          customer: true,
          cashier: true,
        },
        orderBy: options?.orderBy ?? { createdAt: "desc" },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }

  async getTransactionsByCustomerId(
    orgSlug: string,
    customerId: number,
    options?: {
      pagination?: PaginationDto;
      where?: Omit<TransactionWhereInput, "organization" | "organizationId" | "customerId">;
      orderBy?:
        | TransactionOrderByWithRelationInput
        | TransactionOrderByWithRelationInput[]
        | undefined;
    },
  ): Promise<TransactionWithRelations[]> {
    return await this.prisma.transaction.findMany({
      where: {
        ...options?.where,
        customerId,
        organization: { slug: orgSlug },
      },
      skip: options?.pagination?.skip,
      take: options?.pagination?.take,
      include: {
        customer: true,
        cashier: true,
      },
      orderBy: options?.orderBy ?? { createdAt: "desc" },
    });
  }
}
