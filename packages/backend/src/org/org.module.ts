import { Module } from "@nestjs/common";
import { OrgController } from "./org.controller";
import { OrgService } from "./org.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [UserModule],
  controllers: [OrgController],
  providers: [OrgService],
})
export class OrgModule {}
