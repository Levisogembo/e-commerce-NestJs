import { Module } from '@nestjs/common';
import { MpesaController } from './mpesa.controller';
import { MpesaService } from './mpesa.service';
import { HttpModule } from '@nestjs/axios';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    OrdersModule,
    HttpModule.register({
      timeout:30000,
      maxRedirects: 5
    })
  ],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService]
})
export class MpesaModule {}
