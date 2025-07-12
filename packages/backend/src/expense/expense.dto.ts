import { ApiProperty } from "@nestjs/swagger";

import type { ExpenseWithRelations } from "./expense.service";

export class ExpenseEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  description: string;

  @ApiProperty({ format: "number" })
  price: string;

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
    this.price = expense.price.toString();
    this.createdAt = expense.createdAt;
    this.updatedAt = expense.updatedAt;
    this.cashierName = expense.cashier.username;
    this.transactionId = expense.transactionId;
  }
}
