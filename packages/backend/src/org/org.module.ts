import { Module } from "@nestjs/common";
import { OrgController } from "./org.controller.ts";
import { OrgService } from "./org.service.ts";

@Module({
  controllers: [OrgController],
  providers: [OrgService],
})
export class OrgModule {}
