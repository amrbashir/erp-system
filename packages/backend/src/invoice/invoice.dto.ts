import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import type { InvoiceItem } from "../prisma/generated/client";
import type { InvoiceWithRelations } from "./invoice.service";

export class InvoiceItemEntity {
  @ApiProperty()
  description: string;

  @ApiProperty()
  purchase_price: number;

  @ApiProperty()
  selling_price: number;

  @ApiProperty()
  quantity: number;

  constructor(item: InvoiceItem) {
    this.description = item.description;
    this.purchase_price = item.purchase_price;
    this.selling_price = item.selling_price;
    this.quantity = item.quantity;
  }
}

export class InvoiceEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  customerName?: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty({ type: [InvoiceItemEntity] })
  items: InvoiceItemEntity[];

  constructor(invoice: InvoiceWithRelations) {
    this.id = invoice.id;
    this.total = invoice.total;
    this.createdAt = invoice.createdAt;
    this.updatedAt = invoice.updatedAt;
    this.username = invoice.cashier.username;
    this.customerName = invoice.customer?.name;
    this.transactionId = invoice.transactionId;
    this.items = invoice.items.map((item) => new InvoiceItemEntity(item));
  }
}
