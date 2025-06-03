import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard, JwtStrategy } from "./auth.strategy.jwt";
import { JwtRefresgStrategy, JwtRefreshAuthGuard } from "./auth.strategy.jwt-refresh";

@Module({
  imports: [UserModule, PassportModule.register({}), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, JwtRefresgStrategy, JwtRefreshAuthGuard],
})
export class AuthModule {}
