import {
  Module,
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
  type INestApplication,
} from "@nestjs/common";
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
  .setVersion("1.0.0")
  .setTitle("erp-system api")
  .addBearerAuth()
  .addCookieAuth("refreshToken")
  .build();

export function setupApp(app: INestApplication) {
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: "X-Api-Version",
    defaultVersion: [VERSION_NEUTRAL, "1.0.0"],
  });
  app.useGlobalPipes(new ValidationPipe());

  if (process.env.NODE_ENV === "development") {
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api", app, documentFactory, { customSiteTitle: "erp-system api" });
  }
}

export function generateOpenApiJson(app: INestApplication): string {
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  return JSON.stringify(document, null, 2);
}
