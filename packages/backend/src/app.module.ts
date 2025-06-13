import { Module, VersioningType, type INestApplication } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { OrgModule } from "./org/org.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/auth.strategy.jwt";

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

export function setupApp(app: INestApplication) {
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
}
