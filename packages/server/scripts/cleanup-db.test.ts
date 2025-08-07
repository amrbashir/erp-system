import { expect } from "@std/expect";
import { afterAll, beforeAll, it } from "@std/testing/bdd";

import { PrismaClient } from "@/prisma-client.ts";

import { useRandomDatabase } from "../../utils/src/testing.ts";
import { cleanupDatabase } from "./cleanup-db.ts";

const { createDatabase, dropDatabase } = useRandomDatabase();

beforeAll(createDatabase);
afterAll(dropDatabase);

const prisma = new PrismaClient();

async function populateOrg(slug: string) {
  // create an organization
  const organization = await prisma.organization.create({
    data: {
      name: `Test Organization ${slug}`,
      slug,
      balance: 1000,
    },
  });

  // create a user
  const user = await prisma.user.create({
    data: {
      username: `admin-${slug}`,
      password: "password123",
      role: "ADMIN",
      organizationId: organization.id,
    },
  });

  // create a customer
  const customer = await prisma.customer.create({
    data: {
      name: `Customer ${slug}`,
      phone: "123-456-7890",
      address: "123 Test Street",
      organizationId: organization.id,
    },
  });

  // create a product
  const product = await prisma.product.create({
    data: {
      barcode: `PROD-${slug}`,
      description: `Test Product for ${slug}`,
      purchasePrice: 50,
      sellingPrice: 100,
      stockQuantity: 10,
      organizationId: organization.id,
    },
  });

  // create a transaction for expense
  const expenseTransaction = await prisma.transaction.create({
    data: {
      type: "EXPENSE",
      amount: 75,
      cashierId: user.id,
      organizationId: organization.id,
    },
  });

  // create an expense
  const expense = await prisma.expense.create({
    data: {
      description: `Test Expense for ${slug}`,
      amount: 75,
      cashierId: user.id,
      transactionId: expenseTransaction.id,
      organizationId: organization.id,
    },
  });

  // create a transaction for invoice
  const invoiceTransaction = await prisma.transaction.create({
    data: {
      type: "INVOICE",
      amount: 100,
      customerId: customer.id,
      cashierId: user.id,
      organizationId: organization.id,
    },
  });

  // create an invoice
  const invoice = await prisma.invoice.create({
    data: {
      subtotal: 100,
      discountPercent: 0,
      discountAmount: 0,
      total: 100,
      paid: 100,
      remaining: 0,
      customerId: customer.id,
      cashierId: user.id,
      transactionId: invoiceTransaction.id,
      organizationId: organization.id,
      items: {
        create: [
          {
            barcode: product.barcode,
            description: product.description,
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            price: product.sellingPrice,
            quantity: 1,
            discountPercent: 0,
            discountAmount: 0,
            subtotal: 100,
            total: 100,
          },
        ],
      },
    },
  });

  return {
    organization,
    user,
    customer,
    product,
    expense,
    invoice,
  };
}

it("cleans up the database", async () => {
  await populateOrg("test-org-1");
  await populateOrg("test-org-2");
  await populateOrg("test-org-3");

  Deno.env.set("NO_DELETE_ORGS", "test-org-1,test-org-3");

  await cleanupDatabase();

  const org1 = await prisma.organization.findUnique({ where: { slug: "test-org-1" } });
  expect(org1).toBeDefined();

  const org2 = await prisma.organization.findUnique({ where: { slug: "test-org-2" } });
  expect(org2).toBeNull();

  const org3 = await prisma.organization.findUnique({ where: { slug: "test-org-3" } });
  expect(org3).toBeDefined();
});
