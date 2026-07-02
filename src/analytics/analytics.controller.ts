import { BadRequestException, Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ROLES } from 'src/auth/decorators/roles.decorator';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwtRest.guard';
import { RestRolesGuard } from 'src/auth/guards/roles.rest.guard';
import { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
    constructor (private analyticsService: AnalyticsService) {}

    @Get()
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtAuthGuard, RestRolesGuard)
    async getAnalytics (){
        return await this.analyticsService.getMetrics()
    }
    
    @Get('/monthly')
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtAuthGuard, RestRolesGuard)
    async getSales () {
        return await this.analyticsService.getMonthlySalesData()
    }

    @Get('customer')
    @ROLES(Roles.USER)
    @UseGuards(JwtAuthGuard, RestRolesGuard)
    async getCustomerDashboard (@Req() req:Request) {
        const userToken = req.user
        const userId =userToken?.userId
        if(!userId) throw new BadRequestException('No user id given')
        return await this.analyticsService.getDashboardData(userId)
    }

}
