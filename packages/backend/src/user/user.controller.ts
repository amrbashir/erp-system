import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./user.dto";
import { AdminGuard } from "./user.admin.guard";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.strategy.jwt";

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

  @ApiBody({ schema: CreateUserDto.openapiSchema })
  @Post("getAll")
  async getAll(): Promise<void> {
    await this.userService.getAllUsers();
  }
}
