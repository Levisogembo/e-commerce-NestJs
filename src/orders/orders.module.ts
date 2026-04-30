import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from 'src/typeorm/entities/Order';
import { Product } from 'src/typeorm/entities/Product';
import { User } from 'src/typeorm/entities/User';
import { orderItems } from 'src/typeorm/entities/orderItems';
import { MpesaModule } from 'src/mpesa/mpesa.module';
import { Payments } from 'src/typeorm/entities/Payments';
import { OrdersRetryService } from './retries.orders.services';
import { Cart } from 'src/typeorm/entities/Cart';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Coupon } from 'src/typeorm/entities/Coupon';
import { CouponUsage } from 'src/typeorm/entities/CouponUsage';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Orders, Product, User, orderItems, Payments, Cart, Coupon, CouponUsage])
  ],
  controllers: [CartController, CouponController],
  providers: [OrdersService, OrdersResolver, OrdersRetryService, CartService, CouponService],
  exports: [OrdersService]
})
export class OrdersModule {}
