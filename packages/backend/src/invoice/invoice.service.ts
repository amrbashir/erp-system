import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Customer, Invoice, InvoiceItem, User } from "../prisma/generated/client";
import type {
  InvoiceOrderByWithRelationInput,
  InvoiceWhereInput,
} from "../prisma/generated/models";
import { Prisma } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseInvoiceDto, CreateSaleInvoiceDto } from "./invoice.dto";

export type InvoiceWithRelations = Invoice & {
  customer: Customer | null;
  cashier: User;
  items: InvoiceItem[];
};

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async createSaleInvoice(
    orgSlug: string,
    dto: CreateSaleInvoiceDto,
    userId: string,
  ): Promise<InvoiceWithRelations> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Invoice must have at least one item");
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Check stock quantities and prepare invoice items
        const invoiceItems: Omit<InvoiceItem, "id" | "invoiceId">[] = [];
        let subtotal = new Prisma.Decimal(0);

        for (const item of dto.items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId, organization: { slug: orgSlug } },
            select: {
              id: true,
              barcode: true,
              description: true,
              purchasePrice: true,
              sellingPrice: true,
              stockQuantity: true,
            },
          });

          if (!product) {
            throw new BadRequestException(`Product with id ${item.productId} not found`);
          }

          if (product.stockQuantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.description}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
            );
          }

          // Update stock quantity
          await prisma.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });

          // Calculate item subtotal (before invoice-level discount)
          const itemSubtotal = new Prisma.Decimal(item.price).mul(item.quantity);
          const itemPercentDiscount = itemSubtotal.mul(item.discountPercent).div(100);
          const itemTotal = itemSubtotal
            .sub(itemPercentDiscount)
            .sub(new Prisma.Decimal(item.discountAmount));

          invoiceItems.push({
            barcode: product.barcode,
            description: product.description,
            price: new Prisma.Decimal(item.price),
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            quantity: item.quantity,
            discountPercent: item.discountPercent,
            discountAmount: new Prisma.Decimal(item.discountAmount),
            subtotal: itemSubtotal,
            total: itemTotal,
          });

          subtotal = subtotal.add(itemTotal);
        }

        // Apply invoice-level discount
        const percentDiscount = subtotal.mul(dto.discountPercent).div(100);
        const total = subtotal.sub(percentDiscount).sub(new Prisma.Decimal(dto.discountAmount));

        // Create invoice with items and a transaction
        const organization = { connect: { slug: orgSlug } };
        const cashier = { connect: { id: userId } };
        const customer = dto.customerId ? { connect: { id: dto.customerId } } : undefined;
        const invoice = await prisma.invoice.create({
          data: {
            items: { create: invoiceItems },
            subtotal,
            discountPercent: dto.discountPercent,
            discountAmount: new Prisma.Decimal(dto.discountAmount),
            total,
            cashier,
            customer,
            organization,
            transaction: {
              create: {
                amount: total,
                cashier,
                customer,
                organization,
              },
            },
          },
          include: {
            customer: true,
            cashier: true,
            items: true,
          },
        });

        await prisma.organization.update({
          where: { slug: orgSlug },
          data: { balance: { increment: total } },
        });

        return invoice;
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }
      throw error; // Re-throw other errors
    }
  }

  async createPurchaseInvoice(
    orgSlug: string,
    dto: CreatePurchaseInvoiceDto,
    userId: string,
  ): Promise<InvoiceWithRelations> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Invoice must have at least one item");
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Find organization and select its ID
        const org = await prisma.organization.findUnique({
          where: { slug: orgSlug },
          select: { id: true },
        });
        if (!org) throw new NotFoundException("Organization with this slug does not exist");

        // Prepare invoice items
        const invoiceItems: Omit<InvoiceItem, "id" | "invoiceId" | "price">[] = [];
        let subtotal = new Prisma.Decimal(0);

        for (const [index, item] of dto.items.entries()) {
          let barcode = item.barcode || null;
          let description = item.description;

          // Find existing product and select its ID, barcode, and description
          const existingProduct = item.productId
            ? await prisma.product.findUnique({
                where: {
                  id: item.productId,
                  organizationId: org.id,
                },
                select: { id: true, barcode: true, description: true },
              })
            : null;

          if (existingProduct) {
            // Use existing product's barcode and description
            barcode = existingProduct.barcode;
            description = existingProduct.description;

            // Update existing product with new prices and stock quantity
            await prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                purchasePrice: new Prisma.Decimal(item.purchasePrice),
                sellingPrice: new Prisma.Decimal(item.sellingPrice),
                stockQuantity: { increment: item.quantity },
              },
            });
          } else {
            if (!description) {
              throw new BadRequestException(`Description is required for new product at ${index}`);
            }

            // Create new product
            await prisma.product.create({
              data: {
                barcode: barcode,
                description: description,
                purchasePrice: new Prisma.Decimal(item.purchasePrice),
                sellingPrice: new Prisma.Decimal(item.sellingPrice),
                stockQuantity: item.quantity,
                organizationId: org.id,
              },
            });
          }

          // Calculate item subtotal (before invoice-level discount)
          const itemSubtotal = new Prisma.Decimal(item.purchasePrice).mul(item.quantity);
          const itemPercentDiscount = itemSubtotal.mul(item.discountPercent).div(100);
          const itemTotal = itemSubtotal
            .sub(itemPercentDiscount)
            .sub(new Prisma.Decimal(item.discountAmount));

          invoiceItems.push({
            barcode: barcode,
            description: description,
            purchasePrice: new Prisma.Decimal(item.purchasePrice),
            sellingPrice: new Prisma.Decimal(item.sellingPrice),
            quantity: item.quantity,
            discountPercent: item.discountPercent,
            discountAmount: new Prisma.Decimal(item.discountAmount),
            subtotal: itemSubtotal,
            total: itemTotal,
          });

          subtotal = subtotal.add(itemTotal);
        }

        // Apply invoice-level discount
        const percentDiscount = subtotal.mul(dto.discountPercent).div(100);
        const total = subtotal.sub(percentDiscount).sub(new Prisma.Decimal(dto.discountAmount));

        // Prepare transaction data
        const organization = { connect: { slug: orgSlug } };
        const cashier = { connect: { id: userId } };
        const customer = dto.customerId ? { connect: { id: dto.customerId } } : undefined;
        const transaction = {
          create: {
            amount: total.mul(-1), // Negative amount because it's a purchase (money going out)
            cashier,
            customer,
            organization,
          },
        };

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            type: "PURCHASE",
            items: { create: invoiceItems },
            subtotal,
            discountPercent: dto.discountPercent,
            discountAmount: new Prisma.Decimal(dto.discountAmount),
            total,
            cashier,
            customer,
            organization,
            transaction,
          },
          include: {
            customer: true,
            cashier: true,
            items: true,
          },
        });

        // Update organization balance (decrease since it's a purchase)
        await prisma.organization.update({
          where: { slug: orgSlug },
          data: { balance: { decrement: total } },
        });

        return invoice;
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }
      throw error; // Re-throw other errors
    }
  }

  async getAllInvoices(
    orgSlug: string,
    options?: {
      pagination?: PaginationDto;
      where?: InvoiceWhereInput;
      orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[] | undefined;
    },
  ): Promise<InvoiceWithRelations[]> {
    try {
      return await this.prisma.invoice.findMany({
        skip: options?.pagination?.skip,
        take: options?.pagination?.take,
        where: {
          ...options?.where,
          organization: { slug: orgSlug },
        },
        orderBy: options?.orderBy,
        include: {
          customer: true,
          cashier: true,
          items: true,
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundException("Organization with this slug does not exist");
      }

      throw error; // Re-throw other errors
    }
  }
}
