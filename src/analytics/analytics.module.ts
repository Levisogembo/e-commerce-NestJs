import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Product } from 'src/typeorm/entities/Product';
import { Orders } from 'src/typeorm/entities/Order';

@Module({
  imports: [
    TypeOrmModule.forFeature([User,Product,Orders])
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService]
})
export class AnalyticsModule {}
