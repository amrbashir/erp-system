import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateCustomerDto, PaginationDto } from "./customer.dto";
import { useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import type { Customer } from "../prisma/generated";

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: createCustomerDto.organization },
    });
    if (!org) throw new NotFoundException("Organization with this slug does not exist");

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { name: createCustomerDto.name, organizationId: org.id },
    });

    if (existingCustomer) throw new ConflictException("Customer with this name already exists");

    return this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        organizationId: org.id,
      },
    });
  }

  async getAllCustomers(paginationDto?: PaginationDto): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      skip: paginationDto?.skip,
      take: paginationDto?.take,
    });
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
        organization: "test-org",
      };

      const customer = await service.createCustomer(createCustomerDto);
      expect(customer).toBeDefined();
      expect(customer.name).toBe(createCustomerDto.name);
      expect(customer.email).toBe(createCustomerDto.email);
      expect(customer.phone).toBe(createCustomerDto.phone);
      expect(customer.organizationId).toBe(org.id);
    });

    it("should return all customers", async () => {
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
      });

      const customer1 = await service.createCustomer({
        name: "Customer One",
        organization: "test-org",
      });

      const customer2 = await service.createCustomer({
        name: "Customer Two",
        organization: "test-org",
      });

      const customers = await service.getAllCustomers();
      expect(customers).toBeDefined();
      expect(customers.length).toBeGreaterThanOrEqual(2);
      expect(customers).toContainEqual(expect.objectContaining({ id: customer1.id }));
      expect(customers).toContainEqual(expect.objectContaining({ id: customer2.id }));
      expect(customers[0].organizationId).toBe(org!.id);
      expect(customers[1].organizationId).toBe(org!.id);
    });
  });
}
