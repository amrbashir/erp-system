import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthenticatedGuard } from "../auth/auth.authenticated.guard";
import { PaginationDto } from "../pagination.dto";
import { AdminGuard } from "../user/user.admin.guard";
import { TransactionEntity } from "./transaction.dto";
import { TransactionService } from "./transaction.service";

@UseGuards(AuthenticatedGuard, AdminGuard)
@ApiTags("transactions")
@Controller("/orgs/:orgSlug/transactions")
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Get()
  @ApiOkResponse({ type: [TransactionEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() pagination?: PaginationDto,
  ): Promise<TransactionEntity[]> {
    const transactions = await this.service.getAllTransactions(orgSlug, { pagination });
    return transactions.map((transaction) => new TransactionEntity(transaction));
  }

  @Get("customer/:customerId")
  @ApiOkResponse({ type: [TransactionEntity] })
  async getByCustomerId(
    @Param("orgSlug") orgSlug: string,
    @Param("customerId") customerId: number,
    @Query() pagination?: PaginationDto,
  ): Promise<TransactionEntity[]> {
    const transactions = await this.service.getTransactionsByCustomerId(orgSlug, customerId, {
      pagination,
    });
    return transactions.map((transaction) => new TransactionEntity(transaction));
  }
}
