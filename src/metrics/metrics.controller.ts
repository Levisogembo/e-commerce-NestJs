import { Controller, Get, Header } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller('metrics')
export class MetricsController {
    constructor (private metricsService: MetricsService) {}
    
    @Get()
    @Header('Content-Type','text/plain')
    async returnHello () {
        return await this.metricsService.getMetrics()
    }
}