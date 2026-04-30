import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, UsePipes, ValidationPipe, ParseUUIDPipe } from '@nestjs/common'
import { Request } from 'express'
import { CouponService } from './coupon.service'
import { CreateCouponDto } from './Dtos/createCoupon.dto'
import { JwtAuthGuard } from 'src/auth/guards/jwtRest.guard'
import { ROLES } from 'src/auth/decorators/roles.decorator'
import { Roles } from 'src/roles/dtos/enums/roles.enum'
import { RestRolesGuard } from 'src/auth/guards/roles.rest.guard'

@Controller('coupon')
@UsePipes(new ValidationPipe)
@UseGuards(JwtAuthGuard)
export class CouponController {

    constructor(private readonly couponService: CouponService) { }

    @Post('create')
    @ROLES(Roles.ADMIN)
    @UseGuards(RestRolesGuard)
    async createCoupon(@Body() createCouponDto: CreateCouponDto) {
        return await this.couponService.createCoupon(createCouponDto)
    }

    @Get('all')
    @ROLES(Roles.ADMIN)
    @UseGuards(RestRolesGuard)
    async getAllCoupons() {
        return await this.couponService.getAllCoupons()
    }

    @Patch('deactivate/:couponId')
    @ROLES(Roles.ADMIN)
    @UseGuards(RestRolesGuard)
    async deactivateCoupon(@Param('couponId', ParseUUIDPipe) couponId: string) {
        return await this.couponService.deActivateCoupon(couponId)
    }

    @Patch('activate/:couponId')
    @ROLES(Roles.ADMIN)
    @UseGuards(RestRolesGuard)
    async activateCoupon(@Param('couponId') couponId: string) {
        return await this.couponService.activateCoupon(couponId)
    }


    @Get('my-coupon')
    @ROLES(Roles.ADMIN, Roles.USER)
    @UseGuards(RestRolesGuard)
    async getUserCoupon(@Req() userToken: Request) {
        const userId = userToken.user?.userId as string
        return await this.couponService.getUserCoupon(userId)
    }

    @Get('public')
    @ROLES(Roles.ADMIN, Roles.USER)
    @UseGuards(RestRolesGuard)
    async getPublicCoupons() {
        return await this.couponService.getPublicCoupons()
    }


    @Post('validate')
    @ROLES(Roles.ADMIN, Roles.USER)
    @UseGuards(RestRolesGuard)
    async validateCoupon(@Req() userToken: Request, @Body() body: { code: string, cartTotal: number }) {
        const userId = userToken.user?.userId as string
        return await this.couponService.validateCoupon(
            body.code,
            userId,
            body.cartTotal
        )
    }
}