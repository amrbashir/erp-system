import { ForbiddenException, Injectable } from "@nestjs/common";

import type { CanActivate, ExecutionContext } from "@nestjs/common";

import type { User } from "../prisma/generated/client";
import { UserRole } from "../prisma/generated/client";

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user as User;
    if (user.role !== UserRole.ADMIN) throw new ForbiddenException("Not enough permissions");
    return true;
  }
}
