import { Injectable } from "@nestjs/common";

import type { OnModuleInit } from "@nestjs/common";

import { PrismaClient } from "./generated/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
