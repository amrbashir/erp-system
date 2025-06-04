import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CreateOrgDto } from "./org.dto";
import { OrgService } from "./org.service";
import { Public } from "../public.decorator";

@Controller("org")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post("create")
  async create(@Body() createOrgDto: CreateOrgDto): Promise<{ organizationId: string }> {
    const org = await this.orgService.create(createOrgDto);
    if (!org) throw new BadRequestException("Organization creation failed");
    return { organizationId: org.id };
  }
}

if (import.meta.vitest) {
  const { it, expect, describe, beforeEach, afterEach } = import.meta.vitest;

  describe("OrgController", async () => {
    const { PrismaService } = await import("../prisma/prisma.service");

    let prisma;
    let service: OrgService;
    let controller: OrgController;

    const { useRandomDatabase } = await import("../../e2e/utils");
    const { createDatabase, dropDatabase } = useRandomDatabase();

    beforeEach(async () => {
      await createDatabase();
      prisma = new PrismaService();
      service = new OrgService(prisma);
      controller = new OrgController(service);
    });

    afterEach(async () => await dropDatabase());

    it("should create an organization", async () => {
      const createOrgDto: CreateOrgDto = {
        name: "Test Org",
        slug: "test-org",
        username: "admin",
        password: "12345678",
      };
      const result = await controller.create(createOrgDto);
      expect(result).toEqual({ organizationId: expect.any(String) });
    });
  });
}
