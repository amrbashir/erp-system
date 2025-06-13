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
  UsePipes,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { type JwtPayload, type LoginUserDto, loginUserSchema } from "./auth.dto";
import { Public } from "../public.decorator";
import { JwtRefreshAuthGuard } from "./auth.strategy.jwt-refresh";
import { type Response } from "express";
import { ZodValidationPipe } from "../zod.pipe";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  @UsePipes(new ZodValidationPipe(loginUserSchema))
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
  @Post("logout")
  async logout(@Req() req: any): Promise<void> {
    const user = req["user"] as JwtPayload;
    this.authService.logout(user.sub);
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get("refresh")
  async refresh(@Req() req: any): Promise<{ accessToken: string }> {
    const user = req["user"] as JwtPayload;
    return this.authService.refreshAccessToken(user.sub);
  }
}
