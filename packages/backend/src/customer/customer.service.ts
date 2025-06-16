import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateCustomerDto } from "./customer.dto";
import { useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import type { Customer } from "../prisma/generated";

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { name: createCustomerDto.name },
    });

    if (existingCustomer) throw new Error("Customer with this name already exists");

    return this.prisma.customer.create({ data: createCustomerDto });
  }
}

if (import.meta.vitest) {
  const { it, expect, beforeEach, afterEach, describe } = import.meta.vitest;

  describe("CustomerService", async () => {
    let service: CustomerService;
    let prisma: PrismaService;
    let orgService: OrgService;

    const { createDatabase, dropDatabase } = useRandomDatabase();

    beforeEach(async () => {
      await createDatabase();
      prisma = new PrismaService();
      orgService = new OrgService(prisma);
      service = new CustomerService(prisma);
    });

    afterEach(async () => await dropDatabase());

    it("should create a customer", async () => {
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      const createCustomerDto: CreateCustomerDto = {
        name: "Test Customer",
        email: "customer@email.com",
        phone: "1234567890",
        organizationId: org!.id,
      };

      const customer = await service.createCustomer(createCustomerDto);
      expect(customer).toBeDefined();
      expect(customer.name).toBe(createCustomerDto.name);
      expect(customer.email).toBe(createCustomerDto.email);
      expect(customer.phone).toBe(createCustomerDto.phone);
      expect(customer.organizationId).toBe(createCustomerDto.organizationId);
    });
  });
}
