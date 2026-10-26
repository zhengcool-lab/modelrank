import { Controller, Get } from "@nestjs/common";
import type { HealthStatus } from "@modelrank/shared";

@Controller()
export class AppController {
  @Get("health")
  health(): HealthStatus {
    return { status: "ok", uptime: process.uptime() };
  }
}
