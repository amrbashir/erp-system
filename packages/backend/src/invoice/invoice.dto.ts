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
  @Min(0)
  price: number;

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
  discountPercent: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount: number = 0;
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
  discountPercent: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount: number = 0;
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
  purchasePrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  sellingPrice: number;

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
  discountPercent: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount: number = 0;
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
  price: number;

  @ApiProperty()
  purchasePrice: number;

  @ApiProperty()
  sellingPrice: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  discountPercent: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  total: number;

  constructor(item: InvoiceItem) {
    this.barcode = item.barcode || undefined;
    this.description = item.description;
    this.price = item.price;
    this.purchasePrice = item.purchasePrice;
    this.sellingPrice = item.sellingPrice;
    this.quantity = item.quantity;
    this.discountPercent = item.discountPercent;
    this.discountAmount = item.discountAmount;
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
  discountPercent: number;

  @ApiProperty()
  discountAmount: number;

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
    this.discountPercent = invoice.discountPercent;
    this.discountAmount = invoice.discountAmount;
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
