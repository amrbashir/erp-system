import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { UserRole } from "../prisma/generated";

type JwtPayload = {
  username: string;
  sub: number; // User ID
  organizationId: number; // Organization ID
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request["user"];
    const maybeAdmin = await this.userService.findUniqueInOrg(user.username, user.organizationId);

    if (!maybeAdmin) throw new NotFoundException("User not found in organization");

    if (maybeAdmin.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can create users");
    }

    return true;
  }
}
