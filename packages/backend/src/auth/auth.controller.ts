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
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiHeader,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import Express from "express";

import type { Response } from "express";

import type { JwtPayload } from "./auth.dto";
import { LoginResponseDto, LoginUserDto, RefreshTokenResponseDto } from "./auth.dto";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./auth.strategy.jwt";
import { JwtRefreshAuthGuard } from "./auth.strategy.jwt-refresh";

@ApiTags("auth")
@Controller("/orgs/:orgSlug/auth")
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: "Authorization" })
  // we are not accessing orgSlug in the method, but it's required for the route
  // so we declare it here for type generation to work correctly
  @ApiParam({ name: "orgSlug", required: true, type: String })
  @Get("logout")
  async logout(@Req() req: Express.Request): Promise<void> {
    const user = req["user"] as JwtPayload;
    this.authService.logout(user.sub, user.organizationId);
  }

  @ApiCookieAuth()
  // we are not accessing orgSlug in the method, but it's required for the route
  // so we declare it here for type generation to work correctly
  @ApiParam({ name: "orgSlug", required: true, type: String })
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOkResponse({ type: RefreshTokenResponseDto })
  @Get("refresh")
  async refresh(@Req() req: Express.Request): Promise<RefreshTokenResponseDto> {
    const user = req["user"] as JwtPayload;
    return await this.authService.refreshAccessToken(user.sub, user.organizationId);
  }
}
