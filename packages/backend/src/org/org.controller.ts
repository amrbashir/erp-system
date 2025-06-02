import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CreateOrgDto } from "./org.dto.ts";
import { OrgService } from "./org.service.ts";
import { Public } from "../public.decorator.ts";

@Controller("org")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post("create")
  async create(@Body() createOrgDto: CreateOrgDto): Promise<void> {
    await this.orgService.create(createOrgDto);
  }
}
