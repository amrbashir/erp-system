import { Injectable, Logger } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";

import type { User } from "../prisma/generated/client";
import { AuthService } from "./auth.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  private readonly logger = new Logger(SessionSerializer.name);

  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: User, done: (err: Error | null, userId?: string) => void): void {
    this.logger.verbose(`SessionSerializer: serializeUser called with user: ${user.id}`);

    done(null, user.id);
  }

  async deserializeUser(
    id: string,
    done: (err: Error | null, payload?: unknown) => void,
  ): Promise<void> {
    this.logger.verbose(`SessionSerializer: deserializeUser called with id: ${id}`);

    const user = await this.authService.findUserByIdinOrg(id, undefined);

    this.logger.verbose(`SessionSerializer: User found: ${user ? user.id : "not found"}`);

    done(null, user);
  }
}
