import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";

import { OrgModule } from "../org/org.module";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { LocalStrategy } from "./auth.local.strategy";
import { AuthService } from "./auth.service";
import { SessionSerializer } from "./auth.session.serializer";

@Module({
  imports: [OrgModule, UserModule, PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionSerializer],
})
export class AuthModule {}
