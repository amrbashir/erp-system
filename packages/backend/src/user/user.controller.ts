import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./user.dto";
import { AdminGuard } from "./user.admin.guard";
import { PrismaService } from "../prisma/prisma.service";
import { OrgService } from "../org/org.service";
import { useRandomDatabase } from "../../e2e/utils";
import { Test } from "@nestjs/testing";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";

@UseGuards(JwtAuthGuard)
@ApiTags("user")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AdminGuard)
  @ApiBody({ schema: CreateUserDto.openapiSchema })
  @ApiOperation({ operationId: "createUser" })
  @Post("create")
  async create(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.userService.createUser(createUserDto);
  }
}

if (import.meta.vitest) {
  const { it, expect, describe, beforeEach, afterEach } = import.meta.vitest;

  describe("UserController", async () => {
    let orgService: OrgService;
    let service: UserService;
    let controller: UserController;

    const { createDatabase, dropDatabase } = useRandomDatabase();

    beforeEach(async () => {
      await createDatabase();
      const moduleRef = await Test.createTestingModule({
        controllers: [UserController],
        providers: [UserService, PrismaService, OrgService],
      }).compile();

      service = await moduleRef.resolve(UserService);
      controller = await moduleRef.resolve(UserController);
      orgService = await moduleRef.resolve(OrgService);
    });

    afterEach(async () => await dropDatabase());

    it("should create a user", async () => {
      const org = await orgService.create({
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      });

      expect(org).toBeDefined();
      expect(org!.id).toBeDefined();

      const createUserDto: CreateUserDto = {
        username: "testuser",
        password: "1234567",
        organizationId: org!.id,
      };

      await expect(controller.create(createUserDto)).resolves.toBeUndefined();
    });
  });
}
