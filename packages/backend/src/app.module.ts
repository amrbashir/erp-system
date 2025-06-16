import { Module, VersioningType, type INestApplication } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { OrgModule } from "./org/org.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/auth.strategy.jwt";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe } from "./zod.pipe";
import { CustomerModule } from "./customer/customer.module";

@Module({
  imports: [PrismaModule, OrgModule, UserModule, AuthModule, CustomerModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

const swaggerConfig = new DocumentBuilder().setVersion("v1").setTitle("Tech Zone API").build();

export function setupApp(app: INestApplication) {
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(new ZodValidationPipe());

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("v1", app, documentFactory, { customSiteTitle: "Tech Zone API" });
}

export function generateOpenApiJson(app: INestApplication): string {
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  return JSON.stringify(document, null, 2);
}
