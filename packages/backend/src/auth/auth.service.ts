import { Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";

import type { User } from "../prisma/generated/client";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(username: string, password: string, orgSlug: string): Promise<User> {
    const user = await this.userService.findByUsernameInOrg(username, orgSlug);
    if (!user) throw new NotFoundException("Username or password is incorrect");

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) throw new NotFoundException("Username or password is incorrect");

    return user;
  }

  async findUserByIdinOrg(id: string, orgId?: string): Promise<User | null> {
    return await this.userService.findByIdInOrg(id, orgId);
  }
}
