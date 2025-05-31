import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { JwtService } from "@nestjs/jwt";
import { LoginUserDto } from "./auth.dto";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userService.findUniqueInOrg(
      loginUserDto.username,
      loginUserDto.organizationId,
    );
    if (!user) throw new Error("Username or password is incorrect");

    const isPasswordValid = await argon2.verify(user.password, loginUserDto.password);
    if (!isPasswordValid) throw new Error("Username or password is incorrect");

    const payload = { sub: user.id, username: user.username, organizationId: user.organizationId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
