import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class CartItem {
  @Field()
  productId: string

  @Field()
  name: string

  @Field()
  description: string;

  @Field(() => Int)
  price: number

  @Field(() => Int)
  quantity: number

  @Field()
  fileName?: string
}

@Entity()
export class Cart {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  cartId: string;

  @Field()
  @Column()
  @Index()
  userId: string;

  @Field(() => [CartItem])
  @Column({ type: 'jsonb', default: [] })
  items: CartItem[];

  @Field(() => Int)
  @Column({ default: 0 })
  totalItems: number;

  @Field(() => Int)
  @Column({ default: 0 })
  totalAmount: number;
}