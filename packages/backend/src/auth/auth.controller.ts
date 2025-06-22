import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  type JwtPayload,
  LoginResponseDto,
  LoginUserDto,
  RefreshTokenResponseDto,
} from "./auth.dto";
import { JwtRefreshAuthGuard } from "./auth.strategy.jwt-refresh";
import { type Response } from "express";
import { ApiBearerAuth, ApiHeader, ApiCookieAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./auth.strategy.jwt";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  @Post("login")
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { user, tokens } = await this.authService.login(loginUserDto);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      sameSite: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { username: user.username, role: user.role, accessToken: tokens.accessToken };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: "Authorization" })
  @Post("logout")
  async logout(@Req() req: any): Promise<void> {
    const user = req["user"] as JwtPayload;
    this.authService.logout(user.sub);
  }

  @ApiCookieAuth()
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOkResponse({ type: RefreshTokenResponseDto })
  @Get("refresh")
  async refresh(@Req() req: any): Promise<RefreshTokenResponseDto> {
    const user = req["user"] as JwtPayload;
    return await this.authService.refreshAccessToken(user.sub);
  }
}
