import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiCookieAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { type Response } from "express";

import type { JwtPayload } from "./auth.dto";
import { LoginResponseDto, LoginUserDto, RefreshTokenResponseDto } from "./auth.dto";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./auth.strategy.jwt";
import { JwtRefreshAuthGuard } from "./auth.strategy.jwt-refresh";

@ApiTags("auth")
@Controller("/org/:orgSlug/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  @Post("login")
  async login(
    @Param("orgSlug") orgSlug: string,
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { user, tokens } = await this.authService.login(loginUserDto, orgSlug);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      sameSite: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { username: user.username, role: user.role, accessToken: tokens.accessToken, orgSlug };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: "Authorization" })
  @Get("logout")
  async logout(@Req() req: any): Promise<void> {
    const user = req["user"] as JwtPayload;
    this.authService.logout(user.sub, user.organizationId);
  }

  @ApiCookieAuth()
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOkResponse({ type: RefreshTokenResponseDto })
  @Get("refresh")
  async refresh(@Req() req: any): Promise<RefreshTokenResponseDto> {
    const user = req["user"] as JwtPayload;
    return await this.authService.refreshAccessToken(user.sub, user.organizationId);
  }
}
