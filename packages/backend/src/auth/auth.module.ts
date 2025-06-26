import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard, JwtStrategy } from "./auth.strategy.jwt";
import { JwtRefresgStrategy, JwtRefreshAuthGuard } from "./auth.strategy.jwt-refresh";

@Module({
  imports: [UserModule, PassportModule.register({}), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, JwtRefresgStrategy, JwtRefreshAuthGuard],
})
export class AuthModule {}
