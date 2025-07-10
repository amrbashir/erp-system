import { Test, TestingModule } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateRandomOrgData, useRandomDatabase } from "../../e2e/utils";
import { OrgService } from "../org/org.service";
import { PrismaService } from "../prisma/prisma.service";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
  let controller: UserController;
  let orgService: OrgService;

  const { createDatabase, dropDatabase } = useRandomDatabase();

  beforeAll(async () => {
    // Use a random database for testing
    await createDatabase();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, PrismaService, OrgService],
    }).compile();

    controller = await module.resolve(UserController);
    orgService = await module.resolve(OrgService);
  });

  afterAll(dropDatabase);

  it("should return user entities without password or refresh tokens", async () => {
    const orgData = generateRandomOrgData();
    const org = await orgService.create(orgData);

    const createUserDto = {
      username: "testuser",
      password: "12345678",
    };
    await controller.create(org.slug, createUserDto);

    const users = await controller.getAll(org.slug);

    expect(users).toBeDefined();
    expect(users).toHaveLength(2);

    expect(users[0]).toHaveProperty("username", orgData.username);
    expect(users[0]).not.toHaveProperty("password");
    expect(users[0]).not.toHaveProperty("refreshTokens");

    expect(users[1]).toHaveProperty("username", createUserDto.username);
    expect(users[1]).not.toHaveProperty("password");
    expect(users[1]).not.toHaveProperty("refreshTokens");
  });
});
