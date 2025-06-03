import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { UserRole } from "../prisma/generated/client";
import { type JwtPayload } from "../auth/auth.dto";

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
