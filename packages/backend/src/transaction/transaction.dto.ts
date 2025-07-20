import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import type { TransactionWithRelations } from "./transaction.service";
import { TransactionType } from "../prisma/generated/client";

export class TransactionEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ format: "number" })
  amount: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  cashierUsername: string;

  @ApiPropertyOptional()
  customerName?: string;

  constructor(transaction: TransactionWithRelations) {
    this.id = transaction.id;
    this.type = transaction.type;
    this.amount = transaction.amount.toString();
    this.createdAt = transaction.createdAt;
    this.cashierUsername = transaction.cashier.username;
    this.customerName = transaction.customer?.name;
  }
}
