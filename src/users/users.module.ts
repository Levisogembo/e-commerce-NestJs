import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Role } from 'src/typeorm/entities/Role';

@Module({
  imports: [TypeOrmModule.forFeature([User,Role])],
  providers: [UsersService, UsersResolver]
})
export class UsersModule {}
