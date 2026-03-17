import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from 'src/typeorm/entities/Order';
import { Product } from 'src/typeorm/entities/Product';
import { User } from 'src/typeorm/entities/User';
import { orderItems } from 'src/typeorm/entities/orderItems';

@Module({
  imports: [TypeOrmModule.forFeature([Orders, Product, User, orderItems])],
  providers: [OrdersService, OrdersResolver]
})
export class OrdersModule {}
