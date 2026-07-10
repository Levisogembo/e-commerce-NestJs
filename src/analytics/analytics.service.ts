import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { orderStatus } from 'src/orders/Dtos/status.enum';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { Orders } from 'src/typeorm/entities/Order';
import { Product } from 'src/typeorm/entities/Product';
import { User } from 'src/typeorm/entities/User';
import { Between, Repository } from 'typeorm';
import * as moment from 'moment';
import { Coupon } from 'src/typeorm/entities/Coupon';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(Orders) private ordersRepository: Repository<Orders>,
    @InjectRepository(Coupon) private couponsRepository: Repository<Coupon>,
  ) {}

  async getMetrics(): Promise<{
    users: number;
    products: number;
    totalSales: number;
    totalRevenue: number;
  }> {
    const [users, totalUsers] = await this.userRepository.findAndCount({
      where: { role: Roles.USER },
    });
    const [products, totalProducts] =
      await this.productRepository.findAndCount();
    const [sales, totalSales] = await this.ordersRepository.findAndCount({
      where: { status: orderStatus.COMPLETED },
    });
    const totalRevenue = sales.reduce(
      (total, item) => total + Number(item.total || 0),
      0,
    );
    return {
      users: totalUsers,
      products: totalProducts,
      totalSales,
      totalRevenue,
    };
  }

  async getMonthlySalesData() {
    const startDate = moment().subtract(1, 'month').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();
    const dailySalesData = await this.ordersRepository
      .createQueryBuilder('order')
      .select(this.getDateSelectExpression(), 'date')
      .addSelect('COUNT(*)', 'sales')
      .addSelect('COALESCE(SUM(order.total), 0)', 'revenue') //coalesce so that any null order total becomes 0
      .where('order.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('order.status = :status', {
        status: orderStatus.COMPLETED,
      })
      .groupBy(this.getDateGroupExpression())
      .orderBy('date', 'ASC')
      .getRawMany();
    // Map by normalized date key to avoid string mismatch bugs
    const salesByDate = new Map<string, { sales: number; revenue: number }>();
    for (const row of dailySalesData) {
      const dateKey = this.formatDateKey(row.date);
      salesByDate.set(dateKey, {
        sales: Number(row.sales) || 0,
        revenue: Number(row.revenue) || 0,
      });
    }
    const dateArray = this.getDatesInRange(startDate, endDate);
    return dateArray.map((date) => {
      const found = salesByDate.get(date);
      return {
        name: date, // frontend: new Date(item.name)
        sales: found?.sales ?? 0,
        revenue: found?.revenue ?? 0,
      };
    });
  }

  private getDatesInRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const current = moment(startDate).startOf('day');
    const end = moment(endDate).startOf('day');
    while (current.isSameOrBefore(end, 'day')) {
      dates.push(current.format('YYYY-MM-DD'));
      current.add(1, 'day');
    }
    return dates;
  }

  private formatDateKey(value: Date | string): string {
    return moment(value).format('YYYY-MM-DD');
  }

  private getDateSelectExpression(): string {
    const dbType = process.env.DB_TYPE || 'mysql';
    if (dbType === 'postgres') {
      return `TO_CHAR(order.createdAt, 'YYYY-MM-DD')`;
    }
    return `DATE(order.createdAt)`;
  }
  private getDateGroupExpression(): string {
    const dbType = process.env.DB_TYPE || 'mysql';
    if (dbType === 'postgres') {
      return `TO_CHAR(order.createdAt, 'YYYY-MM-DD')`;
    }
    return `DATE(order.createdAt)`;
  }

  async getDashboardData(userId: string) {
    const [orders, totalOrders] = await this.ordersRepository.findAndCount({
      where: { user: { userId } },
      relations: ['orderItems', 'orderItems.Product'],
      order: { createdAt: 'DESC' },
      take: 3,
    });
    const [completed, completedOrders] =
      await this.ordersRepository.findAndCount({
        where: { user: { userId }, status: orderStatus.COMPLETED },
        relations: ['orderItems', 'orderItems.Product'],
        order: { createdAt: 'DESC' },
        take: 3,
      });
    const totalRevenue = completed.reduce(
      (total, item) => total + Number(item.total || 0),
      0,
    );
    const [coupons, couponCount] = await this.couponsRepository.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    return {
      orders,
      totalOrders,
      completed,
      completedOrders,
      totalRevenue,
      coupons,
      couponCount,
    };
  }

  async getCoupons(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [coupons, total] = await this.couponsRepository.findAndCount({
      where: { isActive: true },
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
      select: {
        couponId: true,
        code: true,
        discountType: true,
        discountValue: true,
        expirationDate: true,
        minOrderAmount: true,
        isActive: true,
      },
    });
    return { coupons, total };
  }

  async getOrders(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [customerOrders, customerOrdersCount] =
      await this.ordersRepository.findAndCount({
        where: { user: { userId } },
        relations: ['orderItems', 'orderItems.Product', 'user', 'payments'],
        skip: offset,
        take: limit,
        order: { createdAt: 'DESC' },
        select: {
          user: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      });
    return { customerOrders, customerOrdersCount };
  }
}
