import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateOrgDto, OrganizationEntity } from "./org.dto";
import { OrgService } from "./org.service";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

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
  async getOrg(@Param("orgSlug") orgSlug: string) {
    return this.orgService.findOrgBySlug(orgSlug);
  }
}
