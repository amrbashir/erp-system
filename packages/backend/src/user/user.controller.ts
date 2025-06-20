import { Body, Controller, Post, Query, UseGuards, Get } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto, PaginationDto, UserEntity } from "./user.dto";
import { AdminGuard } from "./user.admin.guard";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";

@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("user")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("create")
  async create(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.userService.createUser(createUserDto);
  }

  @Get("getAll")
  @ApiOkResponse({ type: [UserEntity] })
  async getAll(@Query() paginationDto: PaginationDto) {
    return await this.userService.getAllUsers(paginationDto);
  }
}
