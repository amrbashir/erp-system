import {
  Body,
  Controller,
  Post,
  Query,
  UseGuards,
  Get,
  Delete,
  Param,
  Req,
  ForbiddenException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto, DeleteUserDto, UserEntity } from "./user.dto";
import { AdminGuard } from "./user.admin.guard";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import type { PaginationDto } from "../pagination.dto";
import type { JwtPayload } from "../auth/auth.dto";

@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
@ApiTags("user")
@Controller("/org/:orgSlug/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("create")
  async create(
    @Param("orgSlug") orgSlug: string,
    @Body() createUserDto: CreateUserDto,
  ): Promise<void> {
    await this.userService.createUser(createUserDto, orgSlug);
  }

  @Delete("delete")
  async delete(
    @Param("orgSlug") orgSlug: string,
    @Body() deleteUserDto: DeleteUserDto,
    @Req() req: any,
  ): Promise<void> {
    const currentUser = req["user"] as JwtPayload;

    if (currentUser.username === deleteUserDto.username) {
      throw new ForbiddenException("You cannot delete your own account");
    }

    await this.userService.deleteUser(deleteUserDto, orgSlug);
  }

  @Get("getAll")
  @ApiOkResponse({ type: [UserEntity] })
  async getAll(@Param("orgSlug") orgSlug: string, @Query() pagination: PaginationDto) {
    return await this.userService.getAllUsers(orgSlug, { pagination });
  }
}
