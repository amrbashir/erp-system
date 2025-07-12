import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { Transaction } from "../prisma/generated/client";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { PaginationDto } from "../pagination.dto";
import { AdminGuard } from "../user/user.admin.guard";
import { TransactionEntity } from "./transaction.dto";
import { TransactionService } from "./transaction.service";

@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("transaction")
@Controller("/org/:orgSlug/transaction")
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Get("getAll")
  @ApiOkResponse({ type: [TransactionEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<TransactionEntity[]> {
    const transactions = await this.service.getAllTransactions(orgSlug, paginationDto);
    return transactions.map((transaction) => new TransactionEntity(transaction));
  }
}
