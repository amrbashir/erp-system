import { Body, Controller, Post } from "@nestjs/common";
import { CreateCustomerDto } from "./customer.dto";
import { CustomerService } from "./customer.service";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";

@Controller("customer")
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Post("create")
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.service.createCustomer(createCustomerDto);
  }
}

if (import.meta.vitest) {
  const { it, expect, describe, beforeEach, afterEach } = import.meta.vitest;

  describe("CustomerController", async () => {
    let service: CustomerService;
    let orgService: OrgService;
    let controller: CustomerController;

    const { createDatabase, dropDatabase } = useRandomDatabase();

    beforeEach(async () => {
      await createDatabase();

      const moduleRef = await Test.createTestingModule({
        controllers: [CustomerController],
        providers: [CustomerService, PrismaService, OrgService],
      }).compile();

      service = await moduleRef.resolve(CustomerService);
      controller = await moduleRef.resolve(CustomerController);
      orgService = await moduleRef.resolve(OrgService);
    });

    afterEach(async () => await dropDatabase());

    it("should create a customer", async () => {
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      expect(org).toBeDefined();
      expect(org!.id).toBeDefined();

      const createCustomerDto: CreateCustomerDto = {
        name: "Test Org",
        email: "asd@email.com",
        phone: "1234567890",
        organizationId: org!.id,
      };
      const result = await controller.create(createCustomerDto);
      expect(result).toBeDefined();
      expect(result.name).toBe(createCustomerDto.name);
      expect(result.email).toBe(createCustomerDto.email);
      expect(result.phone).toBe(createCustomerDto.phone);
      expect(result.organizationId).toBe(createCustomerDto.organizationId);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });
}
