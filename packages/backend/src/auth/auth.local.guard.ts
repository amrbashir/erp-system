import { Injectable, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import type { ExecutionContext } from "@nestjs/common";

@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {
  private readonly logger = new Logger(LocalAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose("LocalAuthGuard: canActivate called");

    const result = (await super.canActivate(context)) as boolean;

    if (context.getType() === "http") {
      const request = context.switchToHttp().getRequest();
      await super.logIn(request);
    }

    return result;
  }
}
