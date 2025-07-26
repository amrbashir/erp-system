import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";

import type { User } from "../prisma/generated/client";
import { OrgService } from "../org/org.service";
import { LoginResponseDto, LoginUserDto } from "./auth.dto";
import { LocalAuthGuard } from "./auth.local.guard";
import { AuthUser } from "./auth.user.decorator";

@ApiTags("auth")
@Controller("/orgs/:orgSlug/auth")
export class AuthController {
  constructor(private readonly orgService: OrgService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginUserDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @Post("login")
  async login(
    @Param("orgSlug") orgSlug: string,
    @AuthUser() user: User,
  ): Promise<LoginResponseDto> {
    const org = await this.orgService.findOrgBySlug(orgSlug);
    if (!org) throw new NotFoundException("Organization not found");

    return {
      username: user.username,
      role: user.role,
      orgSlug,
      orgName: org.name,
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
