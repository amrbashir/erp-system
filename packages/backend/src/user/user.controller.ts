import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./user.dto";
import { AuthGuard } from "../auth/auth.guard";
import { AdminGuard } from "./user.admin.guard";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post("create")
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    this.userService.createUser(createUserDto);
  }
}
