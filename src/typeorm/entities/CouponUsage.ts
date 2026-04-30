import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { Field, ObjectType, Int } from '@nestjs/graphql'
import { Coupon } from './Coupon'


@ObjectType()
@Entity({ name: 'couponUsages' })
export class CouponUsage {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    usageId: string

    @Field(() => Coupon)
    @ManyToOne(() => Coupon, coupon => coupon.usages)
    @JoinColumn()
    coupon: Coupon

    @Field()
    @Column({ type: 'varchar' })
    userId: string

    @Field(()=> String, { nullable: true })
    @Column({ type: 'varchar', nullable: true, default: null })
    orderId: string | null

    @Field(() => Int)
    @Column({ type: 'int' })
    discountAmount: number

    @Field()
    @CreateDateColumn()
    usedAt: Date
}