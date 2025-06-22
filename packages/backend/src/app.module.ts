import { Module, ValidationPipe, VersioningType, type INestApplication } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { OrgModule } from "./org/org.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { CustomerModule } from "./customer/customer.module";

@Module({
  imports: [PrismaModule, OrgModule, UserModule, AuthModule, CustomerModule],
})
export class AppModule {}

const swaggerConfig = new DocumentBuilder()
  .setVersion("v1")
  .setTitle("Tech Zone API")
  .addBearerAuth()
  .addCookieAuth("refreshToken")
  .build();

export function setupApp(app: INestApplication) {
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: "X-Api-Version",
    defaultVersion: "1",
  });
  app.useGlobalPipes(new ValidationPipe());

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api", app, documentFactory, { customSiteTitle: "Tech Zone API" });
}

export function generateOpenApiJson(app: INestApplication): string {
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  return JSON.stringify(document, null, 2);
}
