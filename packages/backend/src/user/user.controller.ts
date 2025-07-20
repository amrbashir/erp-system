import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import Express from "express";

import type { JwtPayload } from "../auth/auth.dto";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";
import { PaginationDto } from "../pagination.dto";
import { AdminGuard } from "./user.admin.guard";
import { CreateUserDto, UserEntity } from "./user.dto";
import { UserService } from "./user.service";

@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
@ApiHeader({ name: "Authorization" })
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
    @Req() req: Express.Request,
  ): Promise<void> {
    const currentUser = req["user"] as JwtPayload;

    if (currentUser.sub === id) {
      throw new ForbiddenException("You cannot delete your own account");
    }

    await this.userService.deleteUser(id, orgSlug);
  }
}
