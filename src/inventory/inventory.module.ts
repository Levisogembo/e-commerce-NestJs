import { Module } from '@nestjs/common';
import { InventoryResolver } from './inventory.resolver';
import { InventoryService } from './inventory.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/typeorm/entities/Categories';
import { User } from 'src/typeorm/entities/User';

@Module({
  imports: [TypeOrmModule.forFeature([Category, User])],
  providers: [InventoryResolver, InventoryService]
})
export class InventoryModule {}
