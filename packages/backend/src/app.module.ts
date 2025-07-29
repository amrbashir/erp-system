import { Module, ValidationPipe, VERSION_NEUTRAL, VersioningType } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import session from "express-session";
import passport from "passport";

import type { INestApplication } from "@nestjs/common";

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { PrismaSessionStore } from "./auth/auth.session.store";
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
  controllers: [AppController],
})
export class AppModule {}

const swaggerConfig = new DocumentBuilder()
  .setVersion("1.0.0")
  .setTitle("erp-system api")
  .addBearerAuth()
  .addCookieAuth("refreshToken")
  .build();

export function setupApp(app: INestApplication) {
  // Setup session and passport
  app.use(
    session({
      store: new PrismaSessionStore(app),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        signed: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: "X-Api-Version",
    defaultVersion: [VERSION_NEUTRAL, "1.0.0"],
  });

  app.enableCors({
    origin: process.env.CORS_ALLOW_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Api-Version"],
  });

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Setup Prisma client exception filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  // On development, setup Swagger
  if (process.env.NODE_ENV === "development") {
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api", app, documentFactory, { customSiteTitle: "erp-system api" });
  }

  // Enable shutdown hooks
  app.enableShutdownHooks();
}

export function generateOpenApiJson(app: INestApplication): string {
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  return JSON.stringify(document, null, 2);
}
