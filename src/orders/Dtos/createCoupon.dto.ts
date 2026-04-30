// dto/create-coupon.dto.ts
import { IsString, IsEnum, IsNumber, IsDate, IsOptional, Min, Max, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'
import { DiscountType } from 'src/typeorm/entities/Coupon'

export class CreateCouponDto {
    @IsNotEmpty()
    @IsString()
    code: string

    @IsNotEmpty()
    @IsEnum(DiscountType)
    discountType: DiscountType

    @IsNumber()
    @Min(1)
    @Max(100)  // max 100% or Ksh 100,000 fixed
    discountValue: number

    @Type(() => Date)
    @IsDate()
    expirationDate: Date

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxUses?: number | null

    @IsOptional()
    @IsNumber()
    @Min(0)
    minOrderAmount?: number | null

    @IsOptional()
    @IsString()
    userId?: string | null  // null = global, set = personal
}