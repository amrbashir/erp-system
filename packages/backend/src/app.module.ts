import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module.ts";
import { OrgModule } from "./org/org.module.ts";
import { UserModule } from "./user/user.module.ts";
import { AuthModule } from "./auth/auth.module.ts";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/auth.strategy.jwt.ts";

@Module({
  imports: [PrismaModule, OrgModule, UserModule, AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
