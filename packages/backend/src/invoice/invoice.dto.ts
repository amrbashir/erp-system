import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from "class-validator";

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
  cashierName: string;

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
    this.cashierName = invoice.cashier.username;
    this.customerName = invoice.customer?.name;
    this.transactionId = invoice.transactionId;
    this.items = invoice.items.map((item) => new InvoiceItemEntity(item));
  }
}

export class CreateInvoiceItemDto {
  @ApiProperty({ description: "Product ID" })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ description: "Quantity of the product" })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    type: [CreateInvoiceItemDto],
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
