import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { User } from "../prisma/generated/client";
import { AuthenticatedGuard } from "../auth/auth.authenticated.guard";
import { AuthUser } from "../auth/auth.user.decorator";
import { AdminGuard } from "../user/user.admin.guard";
import {
  AddBalanceDto,
  CreateOrgDto,
  OrganizationEntity,
  OrganizationEntityWithStatistics,
} from "./org.dto";
import { OrgService } from "./org.service";

@ApiTags("orgs")
@Controller("/orgs")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @ApiCreatedResponse()
  @Post("create")
  async create(@Body() createOrgDto: CreateOrgDto): Promise<void> {
    await this.orgService.create(createOrgDto);
  }

  @Get(":orgSlug")
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: OrganizationEntity })
  async getBySlug(
    @Param("orgSlug") orgSlug: string,
    @AuthUser("role") role: User["role"],
  ): Promise<OrganizationEntity | null> {
    const org = await this.orgService.findOrgBySlug(orgSlug);
    return org ? new OrganizationEntity(org, role) : null;
  }

  @Get(":orgSlug/statistics")
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: OrganizationEntityWithStatistics })
  async getStatistics(
    @Param("orgSlug") orgSlug: string,
    @AuthUser("role") role: User["role"],
  ): Promise<OrganizationEntityWithStatistics | null> {
    const org = await this.orgService.getOrgStatistics(orgSlug);
    return new OrganizationEntityWithStatistics(org, role);
  }

  @Post(":orgSlug/addBalance")
  @ApiOkResponse()
  @UseGuards(AuthenticatedGuard, AdminGuard)
  async addBalance(
    @Param("orgSlug") orgSlug: string,
    @Body() addBalanceDto: AddBalanceDto,
    @AuthUser("id") userId: string,
  ): Promise<void> {
    await this.orgService.addBalance(orgSlug, addBalanceDto, userId);
  }
}
