import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";

import type { PaginationDto } from "@/pagination.dto.ts";

import type { PrismaClient } from "../prisma/client.ts";
import type {
  TransactionOrderByWithRelationInput,
  TransactionWhereInput,
} from "../prisma/index.ts";
import type { TransactionWithRelations } from "./transaction.dto.ts";
import { OTelInstrument } from "../otel/instrument.decorator.ts";

const includeTransactionRelations = {
  cashier: {
    select: {
      username: true,
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  invoice: {
    select: {
      id: true,
    },
  },
};

export class TransactionService {
  constructor(private readonly prisma: PrismaClient) {}

  @OTelInstrument
  async getAll(
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
        include: includeTransactionRelations,
        orderBy: options?.orderBy ?? { createdAt: "desc" },
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
  async getByCustomerId(
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
    try {
      return await this.prisma.transaction.findMany({
        where: {
          ...options?.where,
          customerId,
          organization: { slug: orgSlug },
        },
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        include: includeTransactionRelations,
        orderBy: options?.orderBy ?? { createdAt: "desc" },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization or customer does not exist",
        });
      }

      throw error; // Re-throw other errors
    }
  }
}
