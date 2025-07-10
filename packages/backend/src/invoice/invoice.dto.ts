import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

import type { InvoiceItem } from "../prisma/generated/client";
import type { InvoiceWithRelations } from "./invoice.service";
import { PaginationDto } from "../pagination.dto";
import { InvoiceType } from "../prisma/generated/client";

export class CreateSaleInvoiceItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discount_percent: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  discount_amount: number = 0;
}

export class CreateSaleInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  customerId?: number;

  @ApiProperty({ type: [CreateSaleInvoiceItemDto] })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleInvoiceItemDto)
  items: CreateSaleInvoiceItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discount_percent: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  discount_amount: number = 0;
}

export class CreatePurchaseInvoiceItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  purchase_price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  selling_price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discount_percent: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  discount_amount: number = 0;
}

export class CreatePurchaseInvoiceDto extends OmitType(CreateSaleInvoiceDto, ["items"]) {
  @ApiProperty({ type: [CreatePurchaseInvoiceItemDto] })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseInvoiceItemDto)
  items: CreatePurchaseInvoiceItemDto[];
}

export class InvoiceItemEntity {
  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  purchase_price: number;

  @ApiProperty()
  selling_price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  discount_percent: number;

  @ApiProperty()
  discount_amount: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  total: number;

  constructor(item: InvoiceItem) {
    this.barcode = item.barcode || undefined;
    this.description = item.description;
    this.purchase_price = item.purchase_price;
    this.selling_price = item.selling_price;
    this.quantity = item.quantity;
    this.discount_percent = item.discount_percent;
    this.discount_amount = item.discount_amount;
    this.subtotal = item.subtotal;
    this.total = item.total;
  }
}

export class InvoiceEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: InvoiceType })
  type: InvoiceType;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  discount_percent: number;

  @ApiProperty()
  discount_amount: number;

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
  transactionId: number;

  @ApiProperty({ type: [InvoiceItemEntity] })
  items: InvoiceItemEntity[];

  constructor(invoice: InvoiceWithRelations) {
    this.id = invoice.id;
    this.type = invoice.type;
    this.subtotal = invoice.subtotal;
    this.discount_percent = invoice.discount_percent;
    this.discount_amount = invoice.discount_amount;
    this.total = invoice.total;
    this.createdAt = invoice.createdAt;
    this.updatedAt = invoice.updatedAt;
    this.cashierName = invoice.cashier.username;
    this.customerName = invoice.customer?.name;
    this.transactionId = invoice.transactionId;
    this.items = invoice.items.map((item) => new InvoiceItemEntity(item));
  }
}

export class GetAllInvoicesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: InvoiceType })
  @IsOptional()
  @IsEnum(InvoiceType)
  type: InvoiceType = InvoiceType.SALE;
}
