import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateOrgDto, OrgExistsDto } from "./org.dto";
import { OrgService } from "./org.service";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("org")
@Controller("org")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Post("create")
  async create(@Body() createOrgDto: CreateOrgDto): Promise<void> {
    await this.orgService.create(createOrgDto);
  }

  @Post("exists")
  @ApiOkResponse({ type: Boolean })
  async exists(@Body() orgExistsDto: OrgExistsDto): Promise<boolean> {
    return this.orgService.exists(orgExistsDto.slug);
  }
}
