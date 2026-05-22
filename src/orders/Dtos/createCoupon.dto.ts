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

    @Type(()=>Number)
    @IsNumber()
    @Min(1)
    discountValue: number

    @Type(() => Date)
    @IsDate()
    expirationDate: Date

    @IsOptional()
    @Type(()=>Number)
    @IsNumber()
    @Min(1)
    maxUses?: number | null

    @IsOptional()
    @Type(()=>Number)
    @IsNumber()
    @Min(0)
    minOrderAmount?: number | null

    @IsOptional()
    @IsString() 
    userId?: string | null  // null = global, set = personal
}