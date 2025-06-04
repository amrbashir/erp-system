import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./user.dto";
import { AdminGuard } from "./user.admin.guard";
import { PrismaService } from "../prisma/prisma.service";
import { OrgService } from "../org/org.service";
import { useRandomDatabase } from "../../e2e/utils";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post("create")
  async create(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.userService.createUser(createUserDto);
  }
}

if (import.meta.vitest) {
  const { it, expect, describe, beforeEach, afterEach } = import.meta.vitest;

  describe("UserController", async () => {
    let prisma: PrismaService;
    let orgService: OrgService;
    let service: UserService;
    let controller: UserController;

    const { createDatabase, dropDatabase } = useRandomDatabase();

    beforeEach(async () => {
      await createDatabase();
      prisma = new PrismaService();
      orgService = new OrgService(prisma);
      service = new UserService(prisma);
      controller = new UserController(service);
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
        password: "12345678",
        organizationId: org!.id,
      };
      await expect(controller.create(createUserDto)).resolves.toBeUndefined();
    });
  });
}
