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
    this.logger.verbose(`Fetching session for sid: ${sid}`);

    const data = await this.prisma.session.findUnique({ where: { sid } });

    if (data && data.data) {
      this.logger.verbose(`Session found for sid: ${sid}`);

      callback(null, data.data as unknown as session.SessionData);
      return;
    }

    this.logger.verbose(`No session found for sid: ${sid}`);

    callback(null, null);
  }

  async set(
    sid: string,
    session: session.SessionData,
    callback?: (err?: any) => void,
  ): Promise<void> {
    this.logger.verbose(`Setting session for sid: ${sid}`);

    try {
      await this.prisma.session.upsert({
        where: { sid },
        update: { data: session as unknown as InputJsonValue },
        create: { sid, data: session as unknown as InputJsonValue },
      });

      this.logger.verbose(`Session set for sid: ${sid}`);

      callback?.();
    } catch (err) {
      this.logger.error(`Error setting session for sid: ${sid}`, err);

      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    this.logger.verbose(`Destroying session for sid: ${sid}`);

    try {
      await this.prisma.session.delete({ where: { sid } });

      this.logger.verbose(`Session destroyed for sid: ${sid}`);

      callback?.();
    } catch (err) {
      this.logger.warn(`Error destroying session for sid: ${sid}`, err);
      callback?.();
    }
  }
}
