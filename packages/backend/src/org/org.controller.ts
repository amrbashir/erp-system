import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { JwtPayload } from "../auth/auth.dto";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { AdminGuard } from "../user/user.admin.guard";
import { AddBalanceDto, CreateOrgDto, OrganizationEntity } from "./org.dto";
import { OrgService } from "./org.service";

@ApiTags("org")
@Controller("org")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @ApiCreatedResponse()
  @Post("create")
  async create(@Body() createOrgDto: CreateOrgDto): Promise<void> {
    await this.orgService.create(createOrgDto);
  }

  @Post(":orgSlug/addBalance")
  @ApiOkResponse()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async addBalance(
    @Param("orgSlug") orgSlug: string,
    @Body() addBalanceDto: AddBalanceDto,
    @Req() req: any,
  ): Promise<void> {
    const currentUser = req["user"];
    await this.orgService.addBalance(orgSlug, addBalanceDto, currentUser.sub);
  }

  @Get(":orgSlug")
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: OrganizationEntity })
  async getOrg(
    @Param("orgSlug") orgSlug: string,
    @Req() req: any,
  ): Promise<OrganizationEntity | null> {
    const currentUser = req["user"] as JwtPayload;
    const org = await this.orgService.findOrgBySlug(orgSlug);
    return org ? new OrganizationEntity(org, currentUser.role) : null;
  }
}
