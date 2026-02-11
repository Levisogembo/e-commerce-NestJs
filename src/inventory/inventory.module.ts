import { Module } from '@nestjs/common';
import { InventoryResolver } from './inventory.resolver';
import { InventoryService } from './inventory.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/typeorm/entities/Categories';
import { User } from 'src/typeorm/entities/User';
import { subCategoryResolver } from './subCategory.resolver';
import { subCategory } from 'src/typeorm/entities/subCategory';
import { Product } from 'src/typeorm/entities/Product';
import { subCategoryService } from './subCategory.service';
import { productResolver } from './products.resolver';
import { productService } from './product.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, User, subCategory, Product])],
  providers: [InventoryResolver, InventoryService, subCategoryResolver, subCategoryService, productResolver, productService]
})
export class InventoryModule {}
