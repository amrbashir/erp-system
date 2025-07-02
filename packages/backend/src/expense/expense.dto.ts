import { ApiProperty } from "@nestjs/swagger";

import type { ExpenseWithRelations } from "./expense.service";

export class ExpenseEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  cashierName: string;

  @ApiProperty()
  transactionId: string;

  constructor(expense: ExpenseWithRelations) {
    this.id = expense.id;
    this.description = expense.description;
    this.price = expense.price;
    this.createdAt = expense.createdAt;
    this.updatedAt = expense.updatedAt;
    this.cashierName = expense.cashier.username;
    this.transactionId = expense.transactionId;
  }
}
