import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CreateOrgDto, OrganizationEntity } from "./org.dto";
import { OrgService } from "./org.service";

@ApiTags("org")
@Controller("org")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Post("create")
  async create(@Body() createOrgDto: CreateOrgDto): Promise<void> {
    await this.orgService.create(createOrgDto);
  }

  @Get(":orgSlug")
  @ApiOkResponse({ type: OrganizationEntity })
  async getOrg(@Param("orgSlug") orgSlug: string): Promise<OrganizationEntity | null> {
    const org = await this.orgService.findOrgBySlug(orgSlug);
    return org ? new OrganizationEntity(org) : null;
  }
}
