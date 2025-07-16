import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsString } from "class-validator";

import type { ExpenseWithRelations } from "./expense.service";

export class CreateExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ format: "number" })
  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}

export class ExpenseEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  description: string;

  @ApiProperty({ format: "number" })
  amount: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  cashierName: string;

  @ApiProperty()
  transactionId: number;

  constructor(expense: ExpenseWithRelations) {
    this.id = expense.id;
    this.description = expense.description;
    this.amount = expense.amount.toString();
    this.createdAt = expense.createdAt;
    this.updatedAt = expense.updatedAt;
    this.cashierName = expense.cashier.username;
    this.transactionId = expense.transactionId;
  }
}
