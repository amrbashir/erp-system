import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";

import type { Request } from "express";

import type { User } from "../prisma/generated/client";
import { AuthService } from "./auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  private readonly logger: Logger = new Logger(LocalStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({ passReqToCallback: true });
  }

  async validate(req: Request, username: string, password: string): Promise<User> {
    this.logger.verbose(`LocalStrategy: validate called with username: ${username}`);

    const orgSlug = req.params["orgSlug"];
    if (!orgSlug) {
      throw new BadRequestException("Organization slug is required for local authentication");
    }

    return await this.authService.validateUser(username, password, orgSlug);
  }
}
