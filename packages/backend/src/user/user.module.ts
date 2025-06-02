import { Module } from "@nestjs/common";
import { UserController } from "./user.controller.ts";
import { UserService } from "./user.service.ts";
import { AdminGuard } from "./user.admin.guard.ts";

@Module({
  controllers: [UserController],
  providers: [UserService, AdminGuard],
  exports: [UserService],
})
export class UserModule {}
