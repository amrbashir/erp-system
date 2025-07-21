import { Injectable, Logger } from "@nestjs/common";

import type { CanActivate, ExecutionContext } from "@nestjs/common";

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticatedGuard.name);

  canActivate(context: ExecutionContext) {
    this.logger.verbose("AuthenticatedGuard: canActivate called");
    return context.switchToHttp().getRequest().isAuthenticated();
  }
}
