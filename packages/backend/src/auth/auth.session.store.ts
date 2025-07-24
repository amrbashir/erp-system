import { Logger } from "@nestjs/common";
import session, { Store } from "express-session";

import type { INestApplication } from "@nestjs/common";
import type { InputJsonValue } from "@prisma/client/runtime/library";

import { PrismaService } from "../prisma/prisma.service";

export class PrismaSessionStore extends Store {
  private readonly logger: Logger = new Logger(PrismaSessionStore.name);
  private readonly prisma: PrismaService;

  constructor(app: INestApplication) {
    super();
    this.prisma = app.get(PrismaService);
  }

  async get(
    sid: string,
    callback: (err: any, session?: session.SessionData | null) => void,
  ): Promise<void> {
    const data = await this.prisma.session.findUnique({ where: { sid } });

    if (data && data.data) {
      callback(null, data.data as unknown as session.SessionData);
      return;
    }

    callback(null, null);
  }

  async set(
    sid: string,
    session: session.SessionData,
    callback?: (err?: any) => void,
  ): Promise<void> {
    try {
      await this.prisma.session.upsert({
        where: { sid },
        update: { data: session as unknown as InputJsonValue },
        create: { sid, data: session as unknown as InputJsonValue },
      });

      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    try {
      await this.prisma.session.delete({ where: { sid } });

      callback?.();
    } catch (err) {
      callback?.();
    }
  }
}
