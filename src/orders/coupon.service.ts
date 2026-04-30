import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Coupon, DiscountType } from "src/typeorm/entities/Coupon";
import { CouponUsage } from "src/typeorm/entities/CouponUsage";
import { IsNull, Repository } from "typeorm";
import { CreateCouponDto } from "./Dtos/createCoupon.dto";

@Injectable()
export class CouponService {
    constructor(@InjectRepository(Coupon) private couponRepository: Repository<Coupon>,
        @InjectRepository(CouponUsage) private couponUsageRepository: Repository<CouponUsage>,
    ) { }

    async createCoupon(couponPayload: CreateCouponDto): Promise<Coupon> {
        const normalizedCode = couponPayload.code.toUpperCase().trim()
        const existingCoupon = await this.couponRepository.findOne({ where: { code: normalizedCode } })
        if (existingCoupon) throw new ConflictException(`Coupon code ${couponPayload.code} already exists`)

        const coupon = await this.couponRepository.create({
            ...couponPayload,
            code: couponPayload.code.toUpperCase().trim(),
            currentUses: 0,
            isActive: true
        })
        return await this.couponRepository.save(coupon)
    }

    async getAllCoupons(): Promise<Coupon[]> {
        return await this.couponRepository.find({ relations: ['usages'], order: { createdAt: 'DESC' } })
    }

    async deActivateCoupon(couponId: string): Promise<Coupon> {
        const coupon = await this.couponRepository.findOne({ where: { couponId } })
        if (!coupon) throw new NotFoundException('Coupon not found')

        coupon.isActive = false
        return await this.couponRepository.save(coupon)
    }

    async activateCoupon(couponId: string): Promise<Coupon> {
        const coupon = await this.couponRepository.findOne({ where: { couponId } })
        if (!coupon) throw new NotFoundException('Coupon not found')

        coupon.isActive = true
        return await this.couponRepository.save(coupon)
    }

    async getUserCoupon(userId: string): Promise<Coupon | null> {
        return await this.couponRepository.findOne({
            where: { userId, isActive: true }
        })
    }

    async getPublicCoupons(): Promise<Coupon[]> {
        return await this.couponRepository.find({
            where: { userId: IsNull(), isActive: true },
            order: { createdAt: 'DESC' }
        })
    }

    async validateCoupon(code: string, userId: string, cartTotal: number): Promise<{
        couponId: string
        code: string
        discountType: DiscountType
        discountValue: number
        discountAmount: number  // actual amount to deduct in Ksh
        finalAmount: number     // cart total after discount
    }> {
        const coupon = await this.couponRepository.findOne({
            where: { code: code.toUpperCase().trim() }
        })
        if (!coupon) {
            throw new NotFoundException('Coupon code not found')
        }
        if (!coupon.isActive) {
            throw new BadRequestException('This coupon is no longer active')
        }
        if (new Date() > new Date(coupon.expirationDate)) {
            // auto deactivate expired coupon
            coupon.isActive = false
            await this.couponRepository.save(coupon)
            throw new BadRequestException('This coupon has expired')
        }
        if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
            throw new BadRequestException('This coupon has reached its maximum usage limit')
        }
        if (coupon.userId !== null && coupon.userId !== userId) {
            throw new BadRequestException('This coupon is not valid for your account')
        }
        const alreadyUsed = await this.couponUsageRepository.findOne({
            where: { userId, coupon: { couponId: coupon.couponId } },
            relations: ['coupon']
        })
        if (alreadyUsed) {
            throw new BadRequestException('You have already used this coupon')
        }
        if (coupon.minOrderAmount !== null && cartTotal < coupon.minOrderAmount) {
            throw new BadRequestException(
                `Minimum order amount of Ksh ${coupon.minOrderAmount} required for this coupon`
            )
        }
        const discountAmount = this.calculateDiscount(
            coupon.discountType,
            coupon.discountValue,
            cartTotal
        )
        const finalAmount = Math.max(0, cartTotal - discountAmount)
        return {
            couponId: coupon.couponId,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            finalAmount
        }
    }

    async redeemCoupon(couponId: string, userId: string, orderId: string, discountAmount: number): Promise<void> {
        const coupon = await this.couponRepository.findOne({ where: { couponId } })

        if (!coupon) throw new NotFoundException('Coupon not found')

        // record usage
        const usage = this.couponUsageRepository.create({
            coupon,
            userId,
            orderId,
            discountAmount
        })
        await this.couponUsageRepository.save(usage)

        // increment usage count
        coupon.currentUses += 1

        // auto deactivate if max uses reached
        if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
            coupon.isActive = false
        }

        await this.couponRepository.save(coupon)
    }

    private calculateDiscount(discountType: DiscountType, discountValue: number, cartTotal: number): number {
        if (discountType === DiscountType.PERCENTAGE) {
            // e.g. 20% of Ksh 5000 = Ksh 1000
            return Math.round((discountValue / 100) * cartTotal)
        }

        if (discountType === DiscountType.FIXED) {
            // e.g. Ksh 500 off — but can't exceed cart total
            return Math.min(discountValue, cartTotal)
        }

        return 0
    }
}