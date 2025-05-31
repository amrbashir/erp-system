import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { OrgController } from './org/org.controller';
import { OrgModule } from './org/org.module';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, OrgModule, UserModule, AuthModule],
  controllers: [AppController, OrgController],
  providers: [UserService],
})
export class AppModule {}
