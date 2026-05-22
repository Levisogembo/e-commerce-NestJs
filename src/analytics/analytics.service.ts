import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { orderStatus } from 'src/orders/Dtos/status.enum';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { Orders } from 'src/typeorm/entities/Order';
import { Product } from 'src/typeorm/entities/Product';
import { User } from 'src/typeorm/entities/User';
import { Between, Repository } from 'typeorm';
import * as moment from 'moment'

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(Orders) private ordersRepository: Repository<Orders>,
    ) { }

    async getMetrics(): Promise<{
        users: number,
        products: number,
        totalSales: number
        totalRevenue: number
    }> {
        const [users, totalUsers] = await this.userRepository.findAndCount({
            where: { role: Roles.USER }
        })
        const [products, totalProducts] = await this.productRepository.findAndCount()
        const [sales, totalSales] = await this.ordersRepository.findAndCount({
            where: { status: orderStatus.COMPLETED }
        })
        const totalRevenue = sales.reduce(
            (total, item) => total + Number(item.total || 0),
            0
        )
        return {
            users: totalUsers,
            products: totalProducts,
            totalSales,
            totalRevenue
        }
    }

    async getMonthlySalesData() {
        const startDate = moment().subtract(1, 'month').startOf('day').toDate();
        const endDate = moment().endOf('day').toDate();

        const dailySalesData = await this.ordersRepository
            .createQueryBuilder("order")
            .select("DATE(order.createdAt)", "name")
            .addSelect("COUNT(*)", "sales")
            .addSelect("SUM(order.total)", "revenue")
            .where("order.createdAt BETWEEN :start AND :end", {
                start: startDate,
                end: endDate
            })
            .andWhere("order.status = :status", {
                status: orderStatus.COMPLETED
            })
            .groupBy("DATE(order.createdAt)")
            .orderBy("name", "ASC")
            .getRawMany();

        // fill missing dates so chart doesn't break
        const dateArray = this.getDatesInRange(startDate, endDate);

        return dateArray.map(date => {
            const found = dailySalesData.find(d => d.name === date);

            return {
                name: date,
                sales: found?.sales || 0,
                revenue: found?.revenue || 0
            };
        });
    }

    private getDatesInRange(startDate: Date, endDate: Date): string[] {
        const dates: string[] = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split("T")[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    }
}
