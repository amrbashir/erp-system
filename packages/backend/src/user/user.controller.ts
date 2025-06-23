import { Body, Controller, Post, Query, UseGuards, Get, Delete } from "@nestjs/common";
import { UserService } from "./user.service";
import {
  CreateUserDto,
  DeleteUserDto,
  GetAllUsersDto,
  PaginationDto,
  UserEntity,
} from "./user.dto";
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

  @Delete("delete")
  async delete(@Body() deleteUserDto: DeleteUserDto): Promise<void> {
    await this.userService.deleteUser(deleteUserDto);
  }

  @Post("getAll")
  @ApiOkResponse({ type: [UserEntity] })
  async getAll(@Query() pagination: PaginationDto, @Body() getAllUsersDto: GetAllUsersDto) {
    return await this.userService.getAllUsers(getAllUsersDto.organization, { pagination });
  }
}
