import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthenticatedGuard } from "../auth/auth.authenticated.guard";
import { AuthUser } from "../auth/auth.user.decorator";
import { PaginationDto } from "../pagination.dto";
import { AdminGuard } from "./user.admin.guard";
import { CreateUserDto, UserEntity } from "./user.dto";
import { UserService } from "./user.service";

@UseGuards(AuthenticatedGuard, AdminGuard)
@ApiTags("users")
@Controller("/orgs/:orgSlug/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOkResponse({ type: [UserEntity] })
  async getAll(@Param("orgSlug") orgSlug: string, @Query() pagination?: PaginationDto) {
    const users = await this.userService.getAllUsers(orgSlug, { pagination });
    return users.map((user) => new UserEntity(user));
  }

  @Post("create")
  async create(
    @Param("orgSlug") orgSlug: string,
    @Body() createUserDto: CreateUserDto,
  ): Promise<void> {
    await this.userService.createUser(createUserDto, orgSlug);
  }

  @Delete(":id")
  async delete(
    @Param("orgSlug") orgSlug: string,
    @Param("id") id: string,
    @AuthUser("id") currentUserId: string,
  ): Promise<void> {
    if (currentUserId === id) {
      throw new ForbiddenException("You cannot delete your own account");
    }

    await this.userService.deleteUser(id, orgSlug);
  }
}
