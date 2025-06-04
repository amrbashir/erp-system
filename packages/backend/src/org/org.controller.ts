import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CreateOrgDto } from "./org.dto";
import { OrgService } from "./org.service";
import { Public } from "../public.decorator";

@Controller("org")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post("create")
  async create(@Body() createOrgDto: CreateOrgDto): Promise<{ organizationId: string }> {
    const org = await this.orgService.create(createOrgDto);
    if (!org) throw new BadRequestException("Organization creation failed");
    return { organizationId: org.id };
  }
}
