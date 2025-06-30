import { Test, TestingModule } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
  let controller: UserController;
  let orgService: OrgService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeEach(async () => {
    // Use a random database for testing
    await createDatabase();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, PrismaService, OrgService],
    }).compile();

    controller = await module.resolve(UserController);
    orgService = await module.resolve(OrgService);
  });

  afterEach(dropDatabase);

  it("should return user entities without password or refresh tokens", async () => {
    await orgService.create({
      name: "Test Org",
      username: "admin",
      password: "12345678",
      slug: "test-org",
    });

    const createUserDto = {
      username: "testuser",
      password: "12345678",
    };
    await controller.create("test-org", createUserDto);
    const users = await controller.getAll("test-org");
    expect(users).toBeDefined();
    expect(users).toHaveLength(2);
    expect(users[0]).toHaveProperty("username", "admin");
    expect(users[0]).not.toHaveProperty("password");
    expect(users[0]).not.toHaveProperty("refreshTokens");
    expect(users[1]).toHaveProperty("username", createUserDto.username);
    expect(users[1]).not.toHaveProperty("password");
    expect(users[1]).not.toHaveProperty("refreshTokens");
  });
});
