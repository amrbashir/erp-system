import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import type { Transaction } from "../prisma/generated/client";
import type { TransactionWithRelations } from "./transaction.service";

export class TransactionEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ format: "number" })
  amount: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  customerName?: string;

  constructor(transaction: TransactionWithRelations) {
    this.id = transaction.id;
    this.amount = transaction.amount.toString();
    this.createdAt = transaction.createdAt;
    this.username = transaction.cashier.username;
    this.customerName = transaction.customer?.name;
  }
}
