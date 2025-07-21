import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";

import type { User } from "../prisma/generated/client";
import { LoginResponseDto, LoginUserDto } from "./auth.dto";
import { LocalAuthGuard } from "./auth.local.guard";
import { AuthService } from "./auth.service";
import { AuthUser } from "./auth.user.decorator";

@ApiTags("auth")
@Controller("/orgs/:orgSlug/auth")
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginUserDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @Post("login")
  async login(
    @Param("orgSlug") orgSlug: string,
    @AuthUser() user: User,
  ): Promise<LoginResponseDto> {
    return {
      username: user.username,
      role: user.role,
      orgSlug,
    };
  }

  // we are not accessing orgSlug in the method, but it's required for the route
  // so we declare it here for type generation to work correctly
  @ApiParam({ name: "orgSlug", required: true, type: String })
  @Get("logout")
  async logout(@Request() req: any): Promise<void> {
    req.logout(() => ({}));
  }
}
