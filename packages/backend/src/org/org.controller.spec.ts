import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CreateOrgDto } from "./org.dto";
import { useRandomDatabase } from "../../e2e/utils";
import { PrismaService } from "../prisma/prisma.service";
import { OrgController } from "./org.controller";
import { OrgService } from "./org.service";

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

    expect(await controller.create(createOrgDto)).toBeUndefined();
  });
});
