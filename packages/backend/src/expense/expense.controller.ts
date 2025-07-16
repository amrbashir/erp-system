import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { JwtPayload } from "../auth/auth.dto";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { PaginationDto } from "../pagination.dto";
import { CreateExpenseDto, ExpenseEntity } from "./expense.dto";
import { ExpenseService } from "./expense.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("expense")
@Controller("/org/:orgSlug/expense")
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Post("create")
  @ApiOkResponse({ type: ExpenseEntity })
  async create(
    @Param("orgSlug") orgSlug: string,
    @Body() createExpenseDto: CreateExpenseDto,
    @Req() req: any,
  ): Promise<ExpenseEntity> {
    const currentUser = req["user"] as JwtPayload;
    const expense = await this.service.createExpense(orgSlug, createExpenseDto, currentUser.sub);
    return new ExpenseEntity(expense);
  }

  @Get("getAll")
  @ApiOkResponse({ type: [ExpenseEntity] })
  async getAll(
    @Param("orgSlug") orgSlug: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<ExpenseEntity[]> {
    const expenses = await this.service.getAllExpenses(orgSlug, paginationDto);
    return expenses.map((e) => new ExpenseEntity(e));
  }
}
