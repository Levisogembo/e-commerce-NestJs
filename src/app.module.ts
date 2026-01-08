import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { User } from './typeorm/entities/User';
import { Role } from './typeorm/entities/Role';
import { Address } from './typeorm/entities/Addresses';
import { Category } from './typeorm/entities/Categories';
import { Images } from './typeorm/entities/Images';
import { Orders } from './typeorm/entities/Order';
import { orderItems } from './typeorm/entities/orderItems';
import { Payments } from './typeorm/entities/Payments';
import { Product } from './typeorm/entities/Product';
import { subCategory } from './typeorm/entities/subCategory';
import { EmailsModule } from './emails/emails.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        port: configService.get<number>('DB_PORT'),
        host: configService.get<string>('DB_HOST'),
        database: configService.get<string>('DB_NAME'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        entities: [Address,Category,Images,Orders,orderItems,Payments,Product,Role,subCategory,User],
        synchronize: true,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',    
      debug: true,
      playground: true
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    EmailsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
