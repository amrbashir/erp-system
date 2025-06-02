import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.ts";
import { AuthService } from "./auth.service.ts";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../user/user.module.ts";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard, JwtStrategy } from "./auth.strategy.jwt.ts";
import { JwtRefresgStrategy, JwtRefreshAuthGuard } from "./auth.strategy.jwt-refresh.ts";

@Module({
  imports: [UserModule, PassportModule.register({}), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, JwtRefresgStrategy, JwtRefreshAuthGuard],
})
export class AuthModule {}
