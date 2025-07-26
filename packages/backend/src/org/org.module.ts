import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { OrgController } from "./org.controller";
import { OrgService } from "./org.service";

@Module({
  imports: [UserModule],
  controllers: [OrgController],
  providers: [OrgService],
  exports: [OrgService],
})
export class OrgModule {}
