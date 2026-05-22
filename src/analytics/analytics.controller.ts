import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ROLES } from 'src/auth/decorators/roles.decorator';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwtRest.guard';
import { RestRolesGuard } from 'src/auth/guards/roles.rest.guard';

@Controller('analytics')
@ROLES(Roles.ADMIN)
@UseGuards(JwtAuthGuard, RestRolesGuard)
export class AnalyticsController {
    constructor (private analyticsService: AnalyticsService) {}

    @Get()
    async getAnalytics (){
        return await this.analyticsService.getMetrics()
    }
    
    @Get('/monthly')
    async getSales () {
        return await this.analyticsService.getMonthlySalesData()
    }
}
