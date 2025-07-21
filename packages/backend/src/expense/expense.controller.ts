import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { User } from "../prisma/generated/client";
import { AuthenticatedGuard } from "../auth/auth.authenticated.guard";
import { AuthUser } from "../auth/auth.user.decorator";
import { PaginationDto } from "../pagination.dto";
import { CreateExpenseDto, ExpenseEntity } from "./expense.dto";
import { ExpenseService } from "./expense.service";

@UseGuards(AuthenticatedGuard)
@ApiTags("expenses")
@Controller("/orgs/:orgSlug/expenses")
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Get()
  @ApiOkResponse({ type: [ExpenseEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<ExpenseEntity[]> {
    const expenses = await this.service.getAllExpenses(orgSlug, paginationDto);
    return expenses.map((e) => new ExpenseEntity(e));
  }

  @Post("create")
  @ApiOkResponse({ type: ExpenseEntity })
  async create(
    @Param("orgSlug") orgSlug: string,
    @Body() createExpenseDto: CreateExpenseDto,
    @AuthUser("id") userId: string,
  ): Promise<ExpenseEntity> {
    const expense = await this.service.createExpense(orgSlug, createExpenseDto, userId);
    return new ExpenseEntity(expense);
  }
}
