import { Body, Controller, Post, Query, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto, PaginationDto } from "./user.dto";
import { AdminGuard } from "./user.admin.guard";
import { ApiBody, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import type { User } from "../prisma/generated";

@UseGuards(JwtAuthGuard, AdminGuard)
@ApiTags("user")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBody({ schema: CreateUserDto.openapiSchema })
  @Post("create")
  async create(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.userService.createUser(createUserDto);
  }

  @ApiQuery({ schema: PaginationDto.openapiSchema })
  @Post("getAll")
  async getAll(@Query() paginationDto: PaginationDto) {
    return await this.userService.getAllUsers(paginationDto);
  }
}
