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
import { type JwtPayload, LoginUserDto } from "./auth.dto";
import { JwtRefreshAuthGuard } from "./auth.strategy.jwt-refresh";
import { type Response } from "express";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./auth.strategy.jwt";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: LoginUserDto.openapiSchema })
  @Post("login")
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.authService.login(loginUserDto);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      sameSite: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken: tokens.accessToken };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Req() req: any): Promise<void> {
    const user = req["user"] as JwtPayload;
    this.authService.logout(user.sub);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Get("refresh")
  async refresh(@Req() req: any): Promise<{ accessToken: string }> {
    const user = req["user"] as JwtPayload;
    return this.authService.refreshAccessToken(user.sub);
  }
}
