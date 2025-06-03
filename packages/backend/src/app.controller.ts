import { Controller, Get } from "@nestjs/common";
import { Public } from "./public.decorator";

@Controller()
export class AppController {
  @Public()
  @Get()
  index(): string {
    return "Tech Zone Store API";
  }
}
