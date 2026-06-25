import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ROLES } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwtRest.guard';
import { RestRolesGuard } from 'src/auth/guards/roles.rest.guard';
import { MpesaService } from 'src/mpesa/mpesa.service';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { OrdersService } from './orders.service';
import { ExportExcelService } from './excelExport.service';
import { Response } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(
    private mpesaService: MpesaService,
    private ordersService: OrdersService,
    private excelService: ExportExcelService,
  ) {}

  @Post('reverse')
  async refundOrder(
    @Body()
    {
      originalTransactionId,
      amount,
      orderId,
      reason,
    }: {
      originalTransactionId: string;
      amount: number;
      orderId: string;
      reason: string;
    },
  ) {
    return await this.mpesaService.processReversal(
      originalTransactionId,
      amount,
      orderId,
      reason,
    );
  }

  @Get('export')
  @ROLES(Roles.ADMIN)
  @UseGuards(JwtAuthGuard,RestRolesGuard)
  async exportOrders(@Res() res: Response, @Query() filters) {
    const orders = await this.ordersService.exportOrders(filters);
    const buffer = await this.excelService.generateExcel(orders);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=orders.xlsx',
    });
    res.send(buffer)
  }
}
