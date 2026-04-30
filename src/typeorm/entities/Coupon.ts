import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm'
import { Field, ObjectType, Int } from '@nestjs/graphql'
import { CouponUsage } from './CouponUsage'

export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed'
}

@ObjectType()
@Entity({ name: 'coupons' })
export class Coupon {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    couponId: string

    @Field()
    @Column({ unique: true })
    code: string

    @Field()
    @Column({
        type: 'enum',
        enum: DiscountType,
        default: DiscountType.PERCENTAGE
    })
    discountType: DiscountType

    @Field(() => Int)
    @Column()
    discountValue: number  // 20 for 20% or 500 for Ksh 500 fixed

    @Field()
    @Column()
    expirationDate: Date

    @Field()
    @Column({ default: true })
    isActive: boolean

    @Field(()=>Int,{ nullable: true })
    @Column({ type: 'int', nullable: true, default: null })
    maxUses: number | null

    @Field(() => Int)
    @Column({ default: 0 })
    currentUses: number

    @Field(() => Int, { nullable: true })
    @Column({ type: 'int', nullable: true, default: null }) 
    minOrderAmount: number | null

    // null = global coupon, set = personal coupon for specific user
    @Field(()=>String, { nullable: true })
    @Column({ type: 'varchar', nullable: true, default: null })
    userId: string | null

    @Field(() => [CouponUsage], { nullable: true })
    @OneToMany(() => CouponUsage, usage => usage.coupon)
    usages: CouponUsage[]

    @Field()
    @CreateDateColumn()
    createdAt: Date
}