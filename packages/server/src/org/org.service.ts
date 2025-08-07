import { isValidSlug, slugify } from "@erp-system/utils/slug.ts";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import * as argon2 from "argon2";
import { Decimal } from "decimal.js";

import type { PrismaClient } from "@/prisma-client.ts";
import type { Organization } from "@/prisma.ts";
import { TransactionType, UserRole } from "@/prisma.ts";

import type { AddBalanceDto, CreateOrgDto } from "./org.dto.ts";

export interface OrganizationStatistics {
  name: string;
  balance: Decimal;
  transactionCount: number;
  balanceAtDate: { date: Date; balance: Decimal }[];
}

export class OrgService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(createOrgDto: CreateOrgDto): Promise<Organization> {
    if (createOrgDto.slug && !isValidSlug(createOrgDto.slug)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid slug format",
      });
    }

    const slug = createOrgDto.slug || slugify(createOrgDto.name);

    try {
      return await this.prisma.organization.create({
        data: {
          name: createOrgDto.name,
          slug,
          users: {
            create: {
              username: createOrgDto.username,
              password: await argon2.hash(createOrgDto.password),
              role: UserRole.ADMIN,
            },
          },
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        Array.isArray(error.meta?.target) &&
        error.code === "P2002" &&
        error.meta?.target?.includes("slug")
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Organization with this slug already exists",
        });
      }

      throw error; // Re-throw other errors
    }
  }

  findBySlug(slug: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  async addBalance(orgSlug: string, dto: AddBalanceDto, userId: string): Promise<void> {
    try {
      const amount = new Decimal(dto.amount);

      await this.prisma.organization.update({
        where: { slug: orgSlug },
        data: {
          balance: {
            increment: amount,
          },
          transactions: {
            create: {
              type: TransactionType.BALANCE_ADDITION,
              amount: amount,
              cashier: { connect: { id: userId } },
            },
          },
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

  async getStatistics(orgSlug: string): Promise<OrganizationStatistics> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      include: {
        transactions: {
          select: { amount: true, createdAt: true },
          where: {
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)), // Last month
            },
          },
        },
      },
    });

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization with this slug does not exist",
      });
    }

    const transactionCount = org.transactions.length;

    // Get today's date and set to the beginning of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a map of balances at date, starting from the current balance
    const balanceAtDate = new Map<Date, Decimal>();
    const currentBalance = org.balance;

    // Initialize with the current balance
    let runningBalance = currentBalance;

    // Generate balances for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      // Adjust the running balance based on transactions that occurred after this date
      while (org.transactions.length > 0) {
        const txDate = new Date(org.transactions[0].createdAt || 0);
        txDate.setHours(0, 0, 0, 0);

        if (txDate.getTime() > date.getTime()) {
          // This transaction happened after the current date, subtract its effect
          runningBalance = runningBalance.minus(org.transactions[0].amount);
          org.transactions.shift();
        } else {
          break;
        }
      }

      balanceAtDate.set(date, runningBalance);
    }

    return {
      name: org.name,
      balance: currentBalance,
      transactionCount,
      balanceAtDate: balanceAtDate
        .entries()
        .map(([date, balance]) => ({
          date,
          balance,
        }))
        .toArray()
        .reverse(), // Reverse to have the oldest date first,
    };
  }
}
