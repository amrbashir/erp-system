import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import type { CanActivate, ExecutionContext } from "@nestjs/common";

import { type JwtPayload } from "../auth/auth.dto";
import { UserRole } from "../prisma/generated/client";
import { UserService } from "./user.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request["user"] as JwtPayload;
    const maybeAdmin = await this.userService.findByIdinOrg(user.sub, user.organizationId);

    if (!maybeAdmin) throw new NotFoundException("User not found in organization");

    if (maybeAdmin.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can create users");
    }

    return true;
  }
}
