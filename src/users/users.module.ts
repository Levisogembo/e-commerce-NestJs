import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Role } from 'src/typeorm/entities/Role';
import { userAddressesResolver } from './adresses.resolver';
import { Address } from 'src/typeorm/entities/Addresses';
import { addressService } from './address.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Address]), AuthModule],
  providers: [UsersService, UsersResolver, userAddressesResolver, addressService]
})
export class UsersModule {}
