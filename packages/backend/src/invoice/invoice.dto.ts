import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
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
  @IsUUID()
  productId: string;

  @ApiProperty({ format: "number" })
  @IsNotEmpty()
  @IsNumberString()
  price: string;

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

  @ApiPropertyOptional({ format: "number" })
  @IsOptional()
  @IsNumberString()
  @IsNotEmpty()
  discountAmount: string = "0";
}

export class CreateSaleInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
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

  @ApiPropertyOptional({ format: "number" })
  @IsOptional()
  @IsNumberString()
  @IsNotEmpty()
  discountAmount: string = "0";

  @ApiProperty({ format: "number" })
  @IsNotEmpty()
  @IsNumberString()
  paid: string;
}

export class CreatePurchaseInvoiceItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ format: "number" })
  @IsNumberString()
  @IsNotEmpty()
  purchasePrice: string;

  @ApiProperty({ format: "number" })
  @IsNumberString()
  @IsNotEmpty()
  sellingPrice: string;

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

  @ApiPropertyOptional({ format: "number" })
  @IsNumberString()
  @IsOptional()
  @IsNotEmpty()
  discountAmount: string = "0";
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

  @ApiProperty({ format: "number" })
  price: string;

  @ApiProperty({ format: "number" })
  purchasePrice: string;

  @ApiProperty({ format: "number" })
  sellingPrice: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ format: "number" })
  discountPercent: number;

  @ApiProperty({ format: "number" })
  discountAmount: string;

  @ApiProperty({ format: "number" })
  subtotal: string;

  @ApiProperty({ format: "number" })
  total: string;

  constructor(item: InvoiceItem) {
    this.barcode = item.barcode || undefined;
    this.description = item.description;
    this.price = item.price.toString();
    this.purchasePrice = item.purchasePrice.toString();
    this.sellingPrice = item.sellingPrice.toString();
    this.quantity = item.quantity;
    this.discountPercent = item.discountPercent;
    this.discountAmount = item.discountAmount.toString();
    this.subtotal = item.subtotal.toString();
    this.total = item.total.toString();
  }
}

export class InvoiceEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: InvoiceType })
  type: InvoiceType;

  @ApiProperty({ format: "number" })
  subtotal: string;

  @ApiProperty()
  discountPercent: number;

  @ApiProperty({ format: "number" })
  discountAmount: string;

  @ApiProperty({ format: "number" })
  total: string;

  @ApiProperty({ format: "number" })
  paid: string;

  @ApiProperty({ format: "number" })
  remaining: string;

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
    this.subtotal = invoice.subtotal.toString();
    this.discountPercent = invoice.discountPercent;
    this.discountAmount = invoice.discountAmount.toString();
    this.total = invoice.total.toString();
    this.paid = invoice.paid.toString();
    this.remaining = invoice.remaining.toString();
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
