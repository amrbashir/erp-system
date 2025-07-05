import { Module, ValidationPipe, VERSION_NEUTRAL, VersioningType } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import type { INestApplication } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module";
import { CustomerModule } from "./customer/customer.module";
import { ExpenseModule } from "./expense/expense.module";
import { HealthModule } from "./health/health.module";
import { InvoiceModule } from "./invoice/invoice.module";
import { OrgModule } from "./org/org.module";
import { PrismaClientExceptionFilter } from "./prisma/prisma-client-exception.filter";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductModule } from "./product/product.module";
import { TransactionModule } from "./transaction/transaction.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    PrismaModule,
    OrgModule,
    UserModule,
    AuthModule,
    CustomerModule,
    ProductModule,
    TransactionModule,
    InvoiceModule,
    ExpenseModule,
    HealthModule,
  ],
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

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  if (process.env.NODE_ENV === "development") {
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api", app, documentFactory, { customSiteTitle: "erp-system api" });
  }

  app.enableShutdownHooks();
}

export function generateOpenApiJson(app: INestApplication): string {
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  return JSON.stringify(document, null, 2);
}
