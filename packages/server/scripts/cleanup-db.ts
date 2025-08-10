import { PrismaClient } from "../src/prisma/client.ts";

const prisma = new PrismaClient();

const NO_DELETE_ORGS = Deno.env.get("NO_DELETE_ORGS")?.split(",") || [];

export async function cleanupDatabase() {
  await prisma.$transaction(async (prisma) => {
    const orgs = await prisma.organization.findMany({
      where: { slug: { notIn: NO_DELETE_ORGS } },
    });

    for (const org of orgs) {
      const filter = { organizationId: org.id };

      // Delete invoice items first
      await prisma.invoiceItem.deleteMany({ where: { invoice: filter } });

      // Delete invoice and expense which have transaction FK
      await prisma.invoice.deleteMany({ where: filter });
      await prisma.expense.deleteMany({ where: filter });

      // Now we can delete transactions
      await prisma.transaction.deleteMany({ where: filter });

      // Delete remaining entities
      await prisma.product.deleteMany({ where: filter });
      await prisma.customer.deleteMany({ where: filter });
      await prisma.user.deleteMany({ where: filter });

      // Finally delete the organization
      await prisma.organization.deleteMany({ where: { id: org.id } });
    }
  });
}

if (import.meta.main) {
  cleanupDatabase();
}
