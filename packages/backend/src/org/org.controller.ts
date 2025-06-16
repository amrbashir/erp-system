import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CreateOrgDto } from "./org.dto";
import { OrgService } from "./org.service";
import { Public } from "../public.decorator";
import { useRandomDatabase } from "../../e2e/utils";
import { PrismaService } from "../prisma/prisma.service";
import { Test } from "@nestjs/testing";

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
    let service: OrgService;
    let controller: OrgController;

    const { createDatabase, dropDatabase } = useRandomDatabase();

    beforeEach(async () => {
      await createDatabase();

      const moduleRef = await Test.createTestingModule({
        controllers: [OrgController],
        providers: [OrgService, PrismaService],
      }).compile();

      service = await moduleRef.resolve(OrgService);
      controller = await moduleRef.resolve(OrgController);
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
