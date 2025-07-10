import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { PaginationDto } from "../pagination.dto";
import { ExpenseEntity } from "./expense.dto";
import { ExpenseService } from "./expense.service";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("expense")
@Controller("/org/:orgSlug/expense")
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

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
