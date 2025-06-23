import { Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { JwtService } from "@nestjs/jwt";
import { type JwtTokens, type LoginUserDto } from "./auth.dto";
import { UserService } from "../user/user.service";
import { type User } from "../prisma/generated/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginUserDto: LoginUserDto): Promise<{
    user: User;
    tokens: JwtTokens;
  }> {
    const user = await this.userService.findByUsernameInOrg(
      loginUserDto.username,
      loginUserDto.organization,
    );

    if (!user) throw new NotFoundException("Username or password is incorrect");

    const isPasswordValid = await argon2.verify(user.password, loginUserDto.password);
    if (!isPasswordValid) throw new NotFoundException("Username or password is incorrect");

    const refreshToken = await this.genRefreshToken(user);
    const accessToken = await this.genAccessToken(user);

    this.userService.updateRefreshToken(user.id, refreshToken);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException("User not found");
    await this.userService.updateRefreshToken(user.id, undefined);
  }

  async refreshAccessToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException("User not found");
    return { accessToken: await this.genAccessToken(user) };
  }

  async genAccessToken(user: User): Promise<string> {
    const payload = { sub: user.id, organizationId: user.organizationId };
    return this.jwtService.signAsync(payload, {
      expiresIn: "15m",
      secret: process.env.JWT_ACCESS_SECRET,
    });
  }

  async genRefreshToken(user: User): Promise<string> {
    const payload = { sub: user.id, organizationId: user.organizationId };
    return this.jwtService.signAsync(payload, {
      expiresIn: "7d",
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }
}
