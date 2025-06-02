import { Module } from "@nestjs/common";
import { OrgController } from "./org.controller.ts";
import { OrgService } from "./org.service.ts";
import { UserModule } from "../user/user.module.ts";

@Module({
  imports: [UserModule],
  controllers: [OrgController],
  providers: [OrgService],
})
export class OrgModule {}
