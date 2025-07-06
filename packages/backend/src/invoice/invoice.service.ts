import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationDto } from "../pagination.dto";
import type { Customer, Invoice, InvoiceItem, User } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto } from "./invoice.dto";

export type InvoiceWithRelations = Invoice & {
  customer: Customer | null;
  cashier: User;
  items: InvoiceItem[];
};

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(
    orgSlug: string,
    dto: CreateInvoiceDto,
    userId: string,
  ): Promise<InvoiceWithRelations> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Invoice must have at least one item");
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Fetch all products information
        const productIds = dto.items.map((item) => item.productId);
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
            organization: { slug: orgSlug },
          },
        });

        // Check stock quantities and prepare invoice items
        const invoiceItems: Omit<InvoiceItem, "id" | "invoiceId">[] = [];
        let subtotal = 0;

        for (const item of dto.items) {
          const product = products.find((p) => p.id === item.productId);

          if (!product) {
            throw new BadRequestException(`Product with id ${item.productId} not found`);
          }

          if (product.stock_quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.description}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
            );
          }

          // Calculate item subtotal (before invoice-level discount), rounding to base units to avoid fractions
          const itemSubtotal = product.selling_price * item.quantity;
          const itemPercentDiscount = (itemSubtotal * item.discount_percent) / 100;
          const itemTotal = Math.round(
            Math.max(0, itemSubtotal - itemPercentDiscount - item.discount_amount),
          );

          invoiceItems.push({
            description: product.description,
            purchase_price: product.purchase_price,
            selling_price: product.selling_price,
            quantity: item.quantity,
            discount_percent: item.discount_percent,
            discount_amount: item.discount_amount,
            subtotal: itemSubtotal,
            total: itemTotal,
          });

          subtotal += itemTotal;
        }

        // Apply invoice-level discount, rounding to base units to avoid fractions
        const percentDiscount = (subtotal * dto.discount_percent) / 100;
        const total = Math.round(Math.max(0, subtotal - percentDiscount - dto.discount_amount));

        const organization = { connect: { slug: orgSlug } };
        const cashier = { connect: { id: userId } };
        const customer = dto.customerId ? { connect: { id: dto.customerId } } : undefined;

        // Create invoice with items in a transaction
        // Create the invoice
        const invoice = await prisma.invoice.create({
          data: {
            items: { create: invoiceItems },
            subtotal,
            discount_percent: dto.discount_percent,
            discount_amount: dto.discount_amount,
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

        // Update product stock quantities
        for (const item of dto.items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) {
            throw new BadRequestException(`Product with id ${item.productId} not found`);
          }
          await prisma.product.update({
            where: { id: product.id },
            data: { stock_quantity: product.stock_quantity - item.quantity },
          });
        }

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
    paginationDto?: PaginationDto,
  ): Promise<InvoiceWithRelations[]> {
    try {
      return await this.prisma.invoice.findMany({
        where: { organization: { slug: orgSlug } },
        skip: paginationDto?.skip,
        take: paginationDto?.take,
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
