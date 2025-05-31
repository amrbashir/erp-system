import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CreateOrgDto } from "./org.dto";
import { OrgService } from "./org.service";

@Controller("org")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post("create")
  async create(@Body() createOrgDto: CreateOrgDto) {
    this.orgService.create(createOrgDto);
  }
}
