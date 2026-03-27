import { Module } from '@nestjs/common';
import { MpesaController } from './mpesa.controller';
import { MpesaService } from './mpesa.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout:30000,
      maxRedirects: 5
    })
  ],
  controllers: [MpesaController],
  providers: [MpesaService]
})
export class MpesaModule {}
