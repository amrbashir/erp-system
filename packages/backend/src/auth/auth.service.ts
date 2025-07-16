import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";

import { type User } from "../prisma/generated/client";
import { UserService } from "../user/user.service";
import { type JwtPayload, type JwtTokens, type LoginUserDto } from "./auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    loginUserDto: LoginUserDto,
    orgSlug: string,
  ): Promise<{
    user: User;
    tokens: JwtTokens;
  }> {
    const user = await this.userService.findByUsernameInOrg(loginUserDto.username, orgSlug);
    if (!user) throw new NotFoundException("Username or password is incorrect");

    const isPasswordValid = await argon2.verify(user.password, loginUserDto.password);
    if (!isPasswordValid) throw new NotFoundException("Username or password is incorrect");

    const refreshToken = await this.genRefreshToken(user);
    const accessToken = await this.genAccessToken(user);

    await this.userService.updateRefreshToken(user.id, refreshToken);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async logout(userId: string, orgId: string): Promise<void> {
    const user = await this.userService.findByIdinOrg(userId, orgId);
    if (!user) throw new NotFoundException("User not found");
    await this.userService.updateRefreshToken(user.id, undefined);
  }

  async refreshAccessToken(userId: string, orgId: string): Promise<{ accessToken: string }> {
    const user = await this.userService.findByIdinOrg(userId, orgId);
    if (!user) throw new NotFoundException("User not found");
    return { accessToken: await this.genAccessToken(user) };
  }

  async genAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      organizationId: user.organizationId,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: "15m",
      secret: process.env.JWT_ACCESS_SECRET,
    });
  }

  async genRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      organizationId: user.organizationId,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: "7d",
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }
}
