import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import type { Transaction } from "../prisma/generated/client";
import type { TransactionWithRelations } from "./transaction.service";

export class TransactionEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  customerName?: string;

  constructor(transaction: TransactionWithRelations) {
    this.id = transaction.id;
    this.amount = transaction.amount;
    this.createdAt = transaction.createdAt;
    this.username = transaction.cashier.username;
    this.customerName = transaction.customer?.name;
  }
}
