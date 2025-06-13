import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, UsePipes } from "@nestjs/common";
import { UserService } from "./user.service";
import { type CreateUserDto, createUserSchema } from "./user.dto";
import { AdminGuard } from "./user.admin.guard";
import { PrismaService } from "../prisma/prisma.service";
import { OrgService } from "../org/org.service";
import { useRandomDatabase } from "../../e2e/utils";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "../zod.pipe";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post("create")
  @UsePipes(new ZodValidationPipe(createUserSchema))
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

      const createUserDto: CreateUserDto = {
        username: "testuser",
        password: "1234567",
        organizationId: org!.id,
      };

      await expect(controller.create(createUserDto)).resolves.toBeUndefined();
    });
  });
}
