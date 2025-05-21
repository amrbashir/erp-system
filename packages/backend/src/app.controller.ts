import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  index(): string {
    return "Tech Zone Store API";
  }
}
