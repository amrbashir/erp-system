import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { describe, beforeEach, it, expect } from "vitest";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it('should return "Tech Zone Store API"', async () => {
      expect(await appController.index()).toBe("Tech Zone Store API");
    });
  });
});
